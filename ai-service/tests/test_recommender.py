"""Acceptance tests for the career recommendation engine."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.data_loader import get_careers, load_data
from app.main import app
from app.recommend import recommend_careers
from app.schemas import AssessResult, StudentProfile, SubjectMarks
from scripts.simulate import simulate

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


def test_persona_coder():
    """Persona 'coder':

    logical 85, numerical 90, I and C high, marks maths 90 and computer 95.
    Assert: Data Scientist or Software Engineer is #1, and their two scores differ.
    """
    result = AssessResult(
        overallScore=69,
        sectionScores={
            "logical_reasoning": 85,
            "numerical_ability": 90,
            "verbal_ability": 50,
            "spatial_reasoning": 50,
        },
        riasecScores={"R": 1, "I": 8, "A": 1, "S": 1, "E": 1, "C": 7},
        riasecPercent={"R": 12, "I": 100, "A": 12, "S": 12, "E": 12, "C": 88},
        topTypes=["I", "C"],
        strengths=["numerical_ability", "logical_reasoning"],
        weaknesses=["verbal_ability", "spatial_reasoning"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear"},
    )
    profile = StudentProfile(
        student_class="11",
        interests=["coding", "maths"],
        subjectMarks=SubjectMarks(maths=90, computer=95, science=85),
    )

    rec = recommend_careers(result, profile)
    careers = rec["careers"]
    top1 = careers[0]
    top2 = careers[1]

    # #1 must be Data Scientist or Software Engineer
    assert top1["id"] in ["data_scientist", "software_engineer"]
    assert top2["id"] in ["data_scientist", "software_engineer"]

    # Their two scores must differ (in aptitudeFit or combined score breakdown)
    ds = next(c for c in careers if c["id"] == "data_scientist")
    se = next(c for c in careers if c["id"] == "software_engineer")
    assert ds["breakdown"]["aptitudeFit"] != se["breakdown"]["aptitudeFit"]


def test_persona_creative():
    """Persona 'creative':

    spatial 90, Artistic high.
    Assert: Graphic Designer, Architect or Fashion Designer in the top 3.
    """
    result = AssessResult(
        overallScore=65,
        sectionScores={
            "logical_reasoning": 60,
            "numerical_ability": 50,
            "verbal_ability": 60,
            "spatial_reasoning": 90,
        },
        riasecScores={"R": 2, "I": 1, "A": 8, "S": 1, "E": 1, "C": 1},
        riasecPercent={"R": 25, "I": 12, "A": 100, "S": 12, "E": 12, "C": 12},
        topTypes=["A", "R"],
        strengths=["spatial_reasoning"],
        weaknesses=["numerical_ability"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear"},
    )
    rec = recommend_careers(result)
    top3_ids = [c["id"] for c in rec["careers"][:3]]

    assert any(c in top3_ids for c in ["graphic_designer", "architect", "fashion_designer"])


def test_persona_caregiver():
    """Persona 'caregiver':

    verbal 85, Social then Investigative high.
    Assert: Psychologist, Doctor, Physiotherapist or Teacher in the top 3.
    """
    result = AssessResult(
        overallScore=68,
        sectionScores={
            "logical_reasoning": 65,
            "numerical_ability": 50,
            "verbal_ability": 85,
            "spatial_reasoning": 50,
        },
        riasecScores={"R": 1, "I": 6, "A": 1, "S": 8, "E": 1, "C": 1},
        riasecPercent={"R": 12, "I": 75, "A": 12, "S": 100, "E": 12, "C": 12},
        topTypes=["S", "I"],
        strengths=["verbal_ability"],
        weaknesses=["numerical_ability"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear"},
    )
    rec = recommend_careers(result)
    top3_ids = [c["id"] for c in rec["careers"][:3]]

    assert any(c in top3_ids for c in ["psychologist", "doctor", "physiotherapist", "teacher"])


def test_persona_flat():
    """Persona 'flat':

    everything near 50, all RIASEC equal.
    Assert: no match above 75 and confidence 'low'.
    """
    result = AssessResult(
        overallScore=50,
        sectionScores={
            "logical_reasoning": 50,
            "numerical_ability": 50,
            "verbal_ability": 50,
            "spatial_reasoning": 50,
        },
        riasecScores={"R": 4, "I": 4, "A": 4, "S": 4, "E": 4, "C": 4},
        riasecPercent={"R": 50, "I": 50, "A": 50, "S": 50, "E": 50, "C": 50},
        topTypes=["R", "I"],
        strengths=["logical_reasoning"],
        weaknesses=["verbal_ability"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "mixed"},
    )
    rec = recommend_careers(result)
    max_match = max(c["matchPct"] for c in rec["careers"])
    assert max_match <= 75
    assert rec["careers"][0]["confidence"] == "low"


def test_simulation_asserts_all_twenty_careers_and_tie_rate():
    """Run simulate(5000) and verify that all 20 careers reach #1 and tie rate is < 25%."""
    stats = simulate(n=5000, seed=42)
    assert stats["new_unique_top1"] == 20
    assert stats["new_tie_rate"] < 25.0


def test_recommendation_contract_and_top_picks():
    result = AssessResult(
        overallScore=80,
        sectionScores={
            "logical_reasoning": 80,
            "numerical_ability": 85,
            "verbal_ability": 75,
            "spatial_reasoning": 70,
        },
        riasecScores={"R": 2, "I": 7, "A": 2, "S": 3, "E": 4, "C": 6},
        riasecPercent={"R": 25, "I": 88, "A": 25, "S": 38, "E": 50, "C": 75},
        topTypes=["I", "C"],
        strengths=["numerical_ability", "logical_reasoning"],
        weaknesses=["spatial_reasoning"],
        completedAt="2026-11-10T00:00:00Z",
        analysis={"quality": "ok", "interestClarity": "clear"},
    )
    rec = recommend_careers(result)

    assert rec["hasResults"] is True
    assert len(rec["careers"]) == 20

    # Verify fields of every career
    ranks = [c["rank"] for c in rec["careers"]]
    assert ranks == list(range(1, 21))

    for c in rec["careers"]:
        assert "id" in c
        assert "rank" in c
        assert "matchPct" in c
        assert "breakdown" in c
        assert "reasons" in c
        assert "gaps" in c
        assert "confidence" in c
        assert isinstance(c["reasons"], list)
        assert isinstance(c["gaps"], list)

    # Top picks: exactly 5 career ids, at most 2 per stream
    top_picks = rec["topPicks"]
    assert len(top_picks) == 5

    careers_meta = {c["id"]: c for c in get_careers()}
    stream_counts: dict[str, int] = {}
    for c_id in top_picks:
        stream = careers_meta[c_id]["stream"]
        stream_counts[stream] = stream_counts.get(stream, 0) + 1
        assert stream_counts[stream] <= 2


def test_api_recommendations_endpoint():
    payload = {
        "result": {
            "overallScore": 85,
            "sectionScores": {
                "logical_reasoning": 90,
                "numerical_ability": 85,
                "verbal_ability": 70,
                "spatial_reasoning": 65,
            },
            "riasecScores": {"R": 1, "I": 8, "A": 2, "S": 2, "E": 1, "C": 7},
            "riasecPercent": {"R": 12, "I": 100, "A": 25, "S": 25, "E": 12, "C": 88},
            "topTypes": ["I", "C"],
            "strengths": ["logical_reasoning", "numerical_ability"],
            "weaknesses": ["spatial_reasoning"],
            "completedAt": "2026-11-10T00:00:00Z",
            "analysis": {"quality": "ok", "interestClarity": "clear"},
        },
        "language": "en",
    }

    response = client.post("/ai/recommendations", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]["careers"]) == 20
    assert len(body["data"]["topPicks"]) == 5

