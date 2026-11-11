"""Unit tests for deterministic aptitude scoring and analysis."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.analysis import (
    build_analysis,
    calculate_academic_signals,
    calculate_completion_and_quality,
    generate_profile_summary,
)
from app.data_loader import get_questions, load_data
from app.schemas import StudentProfile, SubjectMarks
from app.scoring import (
    COGNITIVE_SECTIONS,
    calculate_overall_score,
    calculate_riasec_percents,
    calculate_riasec_scores,
    calculate_section_scores,
    get_strengths_and_weaknesses,
    get_student_interest_weights,
    get_top_riasec_types,
    rank_riasec_types,
)


@pytest.fixture(autouse=True)
def setup_data():
    load_data()


@pytest.fixture
def questions():
    return get_questions()


@pytest.fixture
def perfect_answers(questions):
    answers: dict[str, str | None] = {}
    for q in questions:
        if q.get("section") != "interest_profile":
            answers[q["id"]] = q["correctAnswer"]
        else:
            # Pick first option for interest questions
            options = q.get("options", [])
            answers[q["id"]] = options[0]["text"] if options else None
    return answers


@pytest.fixture
def all_wrong_answers(questions):
    answers: dict[str, str | None] = {}
    for q in questions:
        answers[q["id"]] = "__DEFINITELY_WRONG_ANSWER__"
    return answers


def test_perfect_answers_give_100_in_every_section(questions, perfect_answers):
    scores = calculate_section_scores(perfect_answers, questions)
    for sec in COGNITIVE_SECTIONS:
        assert scores[sec] == 100, f"Expected 100 for {sec}, got {scores[sec]}"
    overall = calculate_overall_score(scores)
    assert overall == 100


def test_all_wrong_gives_0(questions, all_wrong_answers):
    scores = calculate_section_scores(all_wrong_answers, questions)
    for sec in COGNITIVE_SECTIONS:
        assert scores[sec] == 0, f"Expected 0 for {sec}, got {scores[sec]}"
    overall = calculate_overall_score(scores)
    assert overall == 0


def test_unanswered_answers_lower_completion(questions):
    # Completely empty answers
    empty_answers: dict[str, str | None] = {}
    comp_empty, qual_empty = calculate_completion_and_quality(empty_answers, questions)
    assert comp_empty == 0.0
    assert qual_empty == "low"

    # Half answered (18 out of 36)
    half_answers: dict[str, str | None] = {}
    for i, q in enumerate(questions[:18]):
        opts = q.get("options", [])
        text = opts[0]["text"] if isinstance(opts[0], dict) else opts[0]
        half_answers[q["id"]] = text

    comp_half, qual_half = calculate_completion_and_quality(half_answers, questions)
    assert comp_half == 0.5
    assert qual_half == "low"

    # All 36 answered with rotating option positions
    full_answers: dict[str, str | None] = {}
    for i, q in enumerate(questions):
        opts = q.get("options", [])
        idx = i % len(opts)
        text = opts[idx]["text"] if isinstance(opts[idx], dict) else opts[idx]
        full_answers[q["id"]] = text

    comp_full, qual_full = calculate_completion_and_quality(full_answers, questions)
    assert comp_full == 1.0
    assert qual_full == "ok"


def test_difficulty_weights_change_score_as_expected(questions):
    # In logical_reasoning:
    # lr_01 (easy, w=1), lr_02 (easy, w=1), lr_03 (medium, w=2),
    # lr_04 (medium, w=2), lr_05 (medium, w=2), lr_06 (hard, w=3) -> total weight = 11

    lr_questions = [q for q in questions if q["section"] == "logical_reasoning"]
    easy_q = [q for q in lr_questions if q["difficulty"] == "easy"][0]
    hard_q = [q for q in lr_questions if q["difficulty"] == "hard"][0]

    # Only easy question correct
    ans_easy = {easy_q["id"]: easy_q["correctAnswer"]}
    scores_easy = calculate_section_scores(ans_easy, questions)

    # Only hard question correct
    ans_hard = {hard_q["id"]: hard_q["correctAnswer"]}
    scores_hard = calculate_section_scores(ans_hard, questions)

    assert scores_hard["logical_reasoning"] > scores_easy["logical_reasoning"]
    # 1/11 * 100 = 9%
    assert scores_easy["logical_reasoning"] == 9
    # 3/11 * 100 = 27%
    assert scores_hard["logical_reasoning"] == 27


def test_tie_breaking_is_deterministic(questions):
    # Tie case 1: all RIASEC scores equal (all 0), no profile
    percents_zero = {k: 0 for k in ["R", "I", "A", "S", "E", "C"]}
    top_no_profile = get_top_riasec_types(percents_zero, None, limit=2)
    # Fixed canonical order: R, I, A, S, E, C
    assert top_no_profile == ["R", "I"]

    # Tie case 2: all equal, student has 'coding' in profile interests
    # coding maps to I: 1.0, C: 0.5
    top_with_coding = get_top_riasec_types(percents_zero, ["coding"], limit=2)
    assert top_with_coding == ["I", "C"]

    # Tie case 3: student has 'sports' and 'art'
    # sports maps to R: 1.0, art maps to A: 1.0
    # Between R and A, both have 1.0 interest weight -> canonical order picks R then A
    top_sports_art = get_top_riasec_types(percents_zero, ["sports", "art"], limit=2)
    assert top_sports_art == ["R", "A"]


def test_every_key_of_existing_result_shape_is_present(questions, perfect_answers):
    section_scores = calculate_section_scores(perfect_answers, questions)
    overall_score = calculate_overall_score(section_scores)
    riasec_scores = calculate_riasec_scores(perfect_answers, questions)
    riasec_percents = calculate_riasec_percents(riasec_scores)
    top_types = get_top_riasec_types(riasec_percents, ["coding"], limit=2)
    strengths, weaknesses, strengths_are_relative = get_strengths_and_weaknesses(section_scores)

    profile = StudentProfile(interests=["coding"])
    analysis = build_analysis(
        section_scores=section_scores,
        riasec_percents=riasec_percents,
        top_types=top_types,
        strengths=strengths,
        strengths_are_relative=strengths_are_relative,
        answers=perfect_answers,
        questions=questions,
        profile=profile,
        language="en",
    )

    result_payload = {
        "overallScore": overall_score,
        "sectionScores": section_scores,
        "riasecScores": riasec_scores,
        "topTypes": top_types,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "completedAt": "2026-11-10T19:30:00Z",
        "riasecPercent": riasec_percents,
        "analysis": analysis,
    }

    # The 7 keys read by frontend Results page
    required_keys = [
        "overallScore",
        "sectionScores",
        "riasecScores",
        "topTypes",
        "strengths",
        "weaknesses",
        "completedAt",
    ]
    for key in required_keys:
        assert key in result_payload, f"Missing required result key: {key}"

    # Verify analysis keys
    required_analysis_keys = [
        "hollandCode",
        "interestClarity",
        "cognitiveBalance",
        "completion",
        "quality",
        "academicSignals",
        "profileSummary",
        "strengthsAreRelative",
        "riasecPercent",
    ]
    for key in required_analysis_keys:
        assert key in analysis, f"Missing analysis key: {key}"


def test_same_input_always_gives_same_output(questions, perfect_answers):
    sec1 = calculate_section_scores(perfect_answers, questions)
    sec2 = calculate_section_scores(perfect_answers, questions)
    assert sec1 == sec2

    ov1 = calculate_overall_score(sec1)
    ov2 = calculate_overall_score(sec2)
    assert ov1 == ov2

    ri1 = calculate_riasec_scores(perfect_answers, questions)
    ri2 = calculate_riasec_scores(perfect_answers, questions)
    assert ri1 == ri2

    top1 = get_top_riasec_types(calculate_riasec_percents(ri1), ["coding", "maths"])
    top2 = get_top_riasec_types(calculate_riasec_percents(ri2), ["coding", "maths"])
    assert top1 == top2


def test_strengths_and_weaknesses_relative_forcing():
    # Case 1: All sections high (>= 60)
    high_scores = {
        "logical_reasoning": 90,
        "numerical_ability": 85,
        "verbal_ability": 75,
        "spatial_reasoning": 65,
    }
    s, w, rel = get_strengths_and_weaknesses(high_scores)
    assert len(s) > 0
    assert len(w) == 1
    assert w[0] == "spatial_reasoning"
    assert rel is True

    # Case 2: All sections low (< 60)
    low_scores = {
        "logical_reasoning": 45,
        "numerical_ability": 30,
        "verbal_ability": 20,
        "spatial_reasoning": 10,
    }
    s, w, rel = get_strengths_and_weaknesses(low_scores)
    assert len(w) > 0
    assert len(s) == 1
    assert s[0] == "logical_reasoning"
    assert rel is True

    # Case 3: Mixed scores
    mixed_scores = {
        "logical_reasoning": 80,
        "numerical_ability": 70,
        "verbal_ability": 40,
        "spatial_reasoning": 30,
    }
    s, w, rel = get_strengths_and_weaknesses(mixed_scores)
    assert len(s) == 2
    assert len(w) == 2
    assert rel is False


def test_quality_straight_lining(questions):
    # Straight-lining: answering option index 0 for 95% of questions
    straight_answers: dict[str, str | None] = {}
    for q in questions:
        opts = q.get("options", [])
        straight_answers[q["id"]] = opts[0]["text"] if isinstance(opts[0], dict) else opts[0]

    comp, qual = calculate_completion_and_quality(straight_answers, questions)
    assert comp == 1.0
    assert qual == "low"


def test_academic_signals_divergence():
    # maths maps to numerical_ability
    # science & computer map to logical_reasoning
    section_scores = {
        "numerical_ability": 40,
        "logical_reasoning": 90,
        "verbal_ability": 70,
        "spatial_reasoning": 70,
    }
    marks = SubjectMarks(
        maths=80,      # Diff = 80 - 40 = 40 (>= 25) -> should flag
        science=88,    # Avg science + computer = (88 + 92)/2 = 90. Diff = 0 (< 25) -> not flagged
        computer=92,
        english=72,    # Diff = 2 (< 25) -> not flagged
    )

    signals_en = calculate_academic_signals(marks, section_scores, language="en")
    assert len(signals_en) == 1
    assert signals_en[0]["section"] == "numerical_ability"
    assert signals_en[0]["difference"] == -40
    assert "months of consistent curriculum work" in signals_en[0]["note"]

    signals_hi = calculate_academic_signals(marks, section_scores, language="hi")
    assert len(signals_hi) == 1
    assert "महीनों के नियमित अध्ययन" in signals_hi[0]["note"]


def test_bilingual_profile_summary():
    en_sum = generate_profile_summary(
        overall_score=85,
        strengths=["logical_reasoning"],
        top_types=["I", "A"],
        language="en",
    )
    assert "Logical Reasoning" in en_sum
    assert "85%" in en_sum
    assert "Investigative" in en_sum

    hi_sum = generate_profile_summary(
        overall_score=85,
        strengths=["logical_reasoning"],
        top_types=["I", "A"],
        language="hi",
    )
    assert "तार्किक क्षमता" in hi_sum
    assert "85%" in hi_sum
    assert "विश्लेषणात्मक" in hi_sum

