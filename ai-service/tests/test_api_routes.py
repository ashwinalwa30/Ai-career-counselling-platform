"""Integration tests for the /ai/assess FastAPI endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.data_loader import get_questions, load_data
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


def test_assess_endpoint_success():
    questions = get_questions()
    answers: dict[str, str | None] = {}
    for q in questions:
        if q.get("section") != "interest_profile":
            answers[q["id"]] = q["correctAnswer"]
        else:
            opts = q.get("options", [])
            answers[q["id"]] = opts[0]["text"] if opts else None

    payload = {
        "answers": answers,
        "profile": {
            "class": "10",
            "board": "CBSE",
            "interests": ["coding", "maths"],
            "subjectMarks": {
                "maths": 95,
                "science": 90,
                "english": 85,
            },
        },
        "language": "en",
    }

    response = client.post("/ai/assess", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True
    assert body["message"] == "Assessment scored successfully"

    data = body["data"]
    # Check all existing fields
    assert "overallScore" in data
    assert "sectionScores" in data
    assert "riasecScores" in data
    assert "topTypes" in data
    assert "strengths" in data
    assert "weaknesses" in data
    assert "completedAt" in data
    assert "riasecPercent" in data

    # Check analysis fields
    analysis = data["analysis"]
    assert "hollandCode" in analysis
    assert "interestClarity" in analysis
    assert "cognitiveBalance" in analysis
    assert "completion" in analysis
    assert "quality" in analysis
    assert "academicSignals" in analysis
    assert "profileSummary" in analysis
    assert "strengthsAreRelative" in analysis
    assert "riasecPercent" in analysis


def test_assess_endpoint_validation_error():
    # Invalid request body (missing answers field)
    response = client.post("/ai/assess", json={"language": "en"})
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["data"] is None
    assert "answers" in body["message"]

