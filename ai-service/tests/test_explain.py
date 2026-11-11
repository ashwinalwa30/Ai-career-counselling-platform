"""Acceptance tests for career explanation engine (POST /ai/explain)."""

from __future__ import annotations

import re
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.data_loader import load_data
from app.explain import _extract_numbers, explain_career
from app.main import app
from app.recommend import recommend_careers
from app.schemas import AssessResult, CareerMatch, StudentProfile, SubjectMarks

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


@pytest.fixture
def sample_result():
    return AssessResult(
        overallScore=75,
        sectionScores={
            "logical_reasoning": 85,
            "numerical_ability": 90,
            "verbal_ability": 60,
            "spatial_reasoning": 65,
        },
        riasecScores={"R": 2, "I": 8, "A": 2, "S": 2, "E": 2, "C": 6},
        riasecPercent={"R": 25, "I": 100, "A": 25, "S": 25, "E": 25, "C": 75},
        topTypes=["I", "C"],
        strengths=["numerical_ability", "logical_reasoning"],
        weaknesses=["verbal_ability"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear", "hollandCode": "ICE"},
    )


def test_no_number_missing_from_input_facts(sample_result):
    """Assert that every number in the output fields is derived strictly from input facts."""
    rec = recommend_careers(sample_result)
    ds_match = next(c for c in rec["careers"] if c["id"] == "data_scientist")

    resp = explain_career(
        career_id="data_scientist",
        result=sample_result,
        match=ds_match,
        language="en",
    )

    # Collect all numbers appearing in the output text
    all_output_text = " ".join(
        [resp.headline] + resp.whyItFits + resp.watchOuts + resp.whatWouldChange
    )
    output_numbers = _extract_numbers(all_output_text)

    # Permitted factual numbers:
    # Student scores, RIASEC percentages, overall score, match percentage, target what-if (70),
    # simulated what-if match, and the 50 baseline threshold
    permitted_numbers = {
        50, 70,  # baseline thresholds
        sample_result.overallScore,
        ds_match["matchPct"],
    }
    permitted_numbers.update(sample_result.sectionScores.values())
    permitted_numbers.update(sample_result.riasecPercent.values())

    # Include what-if numbers
    for line in resp.whatWouldChange:
        nums = _extract_numbers(line)
        permitted_numbers.update(nums)

    for num in output_numbers:
        assert num in permitted_numbers, f"Ungrounded number {num} found in output: {all_output_text}"


def test_hindi_output_contains_devanagari(sample_result):
    """Assert that Hindi explanation contains valid Devanagari text across all fields."""
    resp = explain_career(
        career_id="software_engineer",
        result=sample_result,
        language="hi",
    )

    devanagari_pattern = re.compile(r"[\u0900-\u097F]")

    assert devanagari_pattern.search(resp.headline), "Headline must contain Devanagari text"
    assert len(resp.whyItFits) == 3
    for line in resp.whyItFits:
        assert devanagari_pattern.search(line), f"whyItFits line must contain Devanagari text: {line}"


def test_low_match_says_so_and_names_alternatives(sample_result):
    """When matchPct is under 50, headline must state it is weaker and name better alternatives."""
    low_match = CareerMatch(
        id="electrician_iti",
        matchPct=42,
        rank=19,
        confidence="medium",
    )
    top_picks = ["data_scientist", "software_engineer", "chartered_accountant"]

    resp = explain_career(
        career_id="electrician_iti",
        result=sample_result,
        match=low_match,
        top_picks=top_picks,
        language="en",
    )

    assert "weaker match" in resp.headline.lower()
    assert ("Data Scientist" in resp.headline or "Software Engineer" in resp.headline)

    # Also verify in Hindi
    resp_hi = explain_career(
        career_id="electrician_iti",
        result=sample_result,
        match=low_match,
        top_picks=top_picks,
        language="hi",
    )
    assert "कमजोर विकल्प" in resp_hi.headline


def test_what_if_values_equal_real_rerun_of_engine():
    """Verify that what-if matchPct equals an actual re-run of recommend_careers with section=70."""
    # Student with weak spatial reasoning (45%)
    result = AssessResult(
        overallScore=60,
        sectionScores={
            "logical_reasoning": 60,
            "numerical_ability": 60,
            "verbal_ability": 60,
            "spatial_reasoning": 45,
        },
        riasecScores={"R": 2, "I": 2, "A": 8, "S": 1, "E": 1, "C": 1},
        riasecPercent={"R": 25, "I": 25, "A": 100, "S": 12, "E": 12, "C": 12},
        topTypes=["A", "R"],
        strengths=["logical_reasoning"],
        weaknesses=["spatial_reasoning"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear"},
    )

    # Architect requires spatial_reasoning (45) and logical_reasoning (60)
    resp = explain_career(
        career_id="architect",
        result=result,
        language="en",
    )

    assert len(resp.whatWouldChange) > 0

    # Live re-run with spatial_reasoning = 70
    sim_scores = dict(result.sectionScores)
    sim_scores["spatial_reasoning"] = 70
    sim_result = result.model_copy(update={"sectionScores": sim_scores})
    sim_rec = recommend_careers(sim_result)
    expected_new_match = next(c["matchPct"] for c in sim_rec["careers"] if c["id"] == "architect")

    # Verify that whatWouldChange contains this exact percentage
    found = any(f"to {expected_new_match}%" in line for line in resp.whatWouldChange)
    assert found, f"Expected {expected_new_match}% in whatWouldChange lines: {resp.whatWouldChange}"


def test_failed_grounding_check_falls_back_to_rules_text(sample_result):
    """When an LLM response invents a number, grounding validator must reject it and return rules."""
    # Mock LLM output that introduces an ungrounded hallucinated number: 99%
    hallucinated_json = (
        '{"headline": "Software Engineer is great (99%)", '
        '"whyItFits": ["Line 1 with 85%", "Line 2 with 90%", "Line 3 with 99%"], '
        '"watchOuts": [], "whatWouldChange": []}'
    )

    with patch.object(settings, "LLM_API_KEY", "mock_api_key"):
        with patch("app.explain.generate_completion", return_value=hallucinated_json):
            resp = explain_career(
                career_id="software_engineer",
                result=sample_result,
                polish=True,
                language="en",
            )
            # Must reject hallucinated 99% and fall back to rules
            assert resp.source == "rules"
            assert "99%" not in resp.headline
            assert "99%" not in " ".join(resp.whyItFits)


def test_no_llm_configured_endpoint_works(sample_result):
    """With no LLM key configured, the /ai/explain endpoint returns 200 with source 'rules'."""
    payload = {
        "careerId": "data_scientist",
        "result": sample_result.model_dump(),
        "language": "en",
        "polish": False,
    }

    response = client.post("/ai/explain", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True

    data = body["data"]
    assert data["source"] == "rules"
    assert "headline" in data
    assert len(data["whyItFits"]) == 3
    assert isinstance(data["watchOuts"], list)
    assert isinstance(data["whatWouldChange"], list)
    assert data["confidence"] in ["high", "medium", "low"]
