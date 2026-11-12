"""Acceptance tests for personalised career roadmap engine (POST /ai/roadmap)."""

from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from app.data_loader import get_careers, load_data
from app.main import app
from app.roadmap import SECTION_TIPS, personalize_roadmap
from app.schemas import AssessResult, StudentProfile, SubjectMarks

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


def test_class_12_gets_earlier_steps_done():
    """Class 12 students must have Class 10 and Stream steps marked 'done', and streamAdvice is None."""
    profile = StudentProfile(
        student_class="12",
        board="CBSE",
    )
    resp = personalize_roadmap(
        career_id="software_engineer",
        profile=profile,
        language="en",
    )

    assert resp.streamAdvice is None, "Class 12 student should not receive streamAdvice"

    step1 = resp.steps[0]
    step2 = resp.steps[1]
    assert step1.stage == "Class 10"
    assert step1.status == "done"
    assert step2.stage == "Stream"
    assert step2.status == "done"

    # Step 3 (Class 11-12 prep) should be 'now'
    step3 = resp.steps[2]
    assert step3.status == "now"


def test_class_9_gets_stream_advice():
    """Class 9 students must receive streamAdvice and earlier steps must not be marked 'done'."""
    profile = StudentProfile(
        student_class="9",
        board="CBSE",
    )
    resp = personalize_roadmap(
        career_id="software_engineer",
        profile=profile,
        language="en",
    )

    assert resp.streamAdvice is not None, "Class 9 student must receive streamAdvice"
    assert "PCM" in resp.streamAdvice
    assert "Class 11" in resp.streamAdvice

    step1 = resp.steps[0]
    assert step1.status == "now"
    assert step1.status != "done"


def test_weak_required_aptitude_produces_extra_step():
    """When a required aptitude scores under 50, an extra bridge step must be inserted before Entrance Exam."""
    # Software Engineer requires logical_reasoning and numerical_ability
    result = AssessResult(
        overallScore=60,
        sectionScores={
            "logical_reasoning": 45,  # < 50
            "numerical_ability": 75,
            "verbal_ability": 60,
            "spatial_reasoning": 60,
        },
        riasecScores={"R": 2, "I": 7, "A": 2, "S": 2, "E": 2, "C": 7},
        topTypes=["I", "C"],
        strengths=["numerical_ability"],
        weaknesses=["logical_reasoning"],
        completedAt="2026-11-10T00:00:00Z",
    )

    resp = personalize_roadmap(
        career_id="software_engineer",
        result=result,
        profile=StudentProfile(student_class="11"),
        language="en",
    )

    # Base has 7 steps, with 1 weak aptitude it must have 8 steps
    assert len(resp.steps) == 8

    # Find the bridge step
    bridge_step = next((s for s in resp.steps if "Strengthen Logical Reasoning" in s.title), None)
    assert bridge_step is not None
    assert bridge_step.stage == "Aptitude Bridge"
    assert len(bridge_step.actions) == 3

    # Actions must match SECTION_TIPS['logical_reasoning']
    expected_tips = SECTION_TIPS["logical_reasoning"]
    for i in range(3):
        assert bridge_step.actions[i] == expected_tips[i]

    # Verify bridge step is located immediately before Entrance Exam
    bridge_idx = next(i for i, s in enumerate(resp.steps) if s.step == bridge_step.step)
    exam_step = resp.steps[bridge_idx + 1]
    assert "Entrance Exam" in exam_step.stage or "Exam" in exam_step.stage


def test_marks_gate_adds_watch_out_and_related_career():
    """If matching marks for PCM are < 60, Stream step must add watch-out target and related career."""
    profile = StudentProfile(
        student_class="10",
        subjectMarks=SubjectMarks(maths=52, science=75),  # Maths is 52 (< 60)
    )

    resp = personalize_roadmap(
        career_id="software_engineer",
        profile=profile,
        language="en",
    )

    stream_step = next(s for s in resp.steps if s.stage == "Stream")
    assert "Maths" in stream_step.desc
    assert "75 or above" in stream_step.desc
    # Must name a related career from careers.json (data_scientist, game_developer, or entrepreneur)
    assert any(c in stream_step.desc for c in ["Data Scientist", "Game Developer", "Entrepreneur"])


def test_no_exam_or_college_outside_careers_json():
    """Verify that all entrance exams in examPlan come strictly from career record in careers.json."""
    careers = get_careers()
    se = next(c for c in careers if c["id"] == "software_engineer")
    allowed_exam_names = {e["name"] for e in se["entranceExams"]}

    resp = personalize_roadmap(
        career_id="software_engineer",
        language="en",
    )

    for exam_item in resp.examPlan:
        assert exam_item["name"] in allowed_exam_names
        assert exam_item["startPreparingBy"] in ["Class 11", "Class 12"]


def test_hindi_output_works():
    """Verify that language='hi' returns valid Devanagari text in steps, advice, and focus areas."""
    profile = StudentProfile(student_class="10")
    resp = personalize_roadmap(
        career_id="software_engineer",
        profile=profile,
        language="hi",
    )

    devanagari = re.compile(r"[\u0900-\u097F]")

    assert resp.streamAdvice is not None
    assert devanagari.search(resp.streamAdvice)

    for step in resp.steps:
        assert devanagari.search(step.title) or devanagari.search(step.timing)
        for act in step.actions:
            assert devanagari.search(act)


def test_everything_works_with_no_llm_endpoint():
    """Verify that POST /ai/roadmap works with 200 OK and returns source='rules' without LLM."""
    payload = {
        "careerId": "software_engineer",
        "profile": {
            "class": "10",
            "board": "CBSE",
        },
        "language": "en",
        "polish": False,
    }

    response = client.post("/ai/roadmap", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True

    data = body["data"]
    assert data["source"] == "rules"
    assert len(data["steps"]) >= 7
    assert len(data["examPlan"]) >= 1
    assert len(data["focusAreas"]) >= 1
    assert len(data["backupPaths"]) >= 1

