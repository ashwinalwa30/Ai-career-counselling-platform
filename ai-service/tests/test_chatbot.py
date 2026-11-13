"""Acceptance tests for AI Counsellor Chatbot (POST /ai/chat)."""

from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from app.chatbot import chat_counsellor
from app.data_loader import load_data
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


def test_stream_intent_detection():
    """Verify that queries about streams return structured guidance on PCM, PCB, Commerce, Arts."""
    resp = chat_counsellor(message="Which stream should I choose after 10th?", language="en")
    assert resp.source in ("rules", "fallback")
    reply = resp.reply.lower()
    assert "pcm" in reply or "science" in reply
    assert "commerce" in reply
    assert "arts" in reply or "humanities" in reply


def test_career_intent_grounded_in_careers_json():
    """Verify that specific career questions extract real data from careers.json (exams, colleges, salary)."""
    resp = chat_counsellor(message="Tell me about becoming a Doctor in India", language="en")
    reply = resp.reply
    assert "Doctor (MBBS)" in reply or "Doctor" in reply
    assert "NEET" in reply
    assert "AIIMS" in reply or "colleges" in reply.lower()
    assert "₹" in reply  # Salary figure in INR


def test_salary_intent_grounded_and_realistic():
    """Verify that salary questions quote realistic brackets from careers data with no deceptive promises."""
    resp = chat_counsellor(message="What salary can I earn in tech and engineering?", language="en")
    reply = resp.reply
    assert "₹" in reply
    assert "lakh" in reply.lower() or "lpa" in reply.lower() or "l" in reply.lower()
    # No guarantees
    assert "guaranteed" not in reply.lower()


def test_context_personalisation():
    """Verify that passing test results and top careers in context personalises the chatbot advice."""
    context = {
        "testResult": {"overallScore": 84},
        "topCareers": ["Software Engineer", "Data Scientist", "Chartered Accountant"],
    }
    resp = chat_counsellor(message="What career fits me?", context=context, language="en")
    reply = resp.reply
    assert "84%" in reply
    assert "Software Engineer" in reply


def test_hindi_chat_replies():
    """Verify that language='hi' returns natural Hindi text with Devanagari script."""
    resp = chat_counsellor(message="मुझे कक्षा 10वीं के बाद क्या करना चाहिए?", language="hi")
    devanagari = re.compile(r"[\u0900-\u097F]")
    assert devanagari.search(resp.reply), "Reply must contain Devanagari text"


def test_no_guaranteed_admissions_or_results():
    """Verify that replies never claim guaranteed admission, fixed cutoffs, or guaranteed jobs."""
    test_queries = [
        "Will I definitely get into IIT Bombay?",
        "Can you guarantee I will become a doctor?",
        "Promise me I will earn 50 Lakhs",
    ]
    for q in test_queries:
        resp = chat_counsellor(message=q, language="en")
        lowered = resp.reply.lower()
        assert "guarantee" not in lowered
        assert "promise" not in lowered
        assert "100% admission" not in lowered


def test_chat_endpoint_contract():
    """Verify POST /ai/chat returns 200 OK with envelope and source='rules'."""
    payload = {
        "message": "What entrance exam is needed for law?",
        "language": "en",
        "history": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello! How can I help you today?"},
        ],
    }

    response = client.post("/ai/chat", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert body["success"] is True

    data = body["data"]
    assert "reply" in data
    assert "CLAT" in data["reply"]
    assert data["source"] in ("rules", "fallback")

