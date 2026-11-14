"""Aptitude scoring and RIASEC analysis calculations.

All computations are deterministic pure functions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

COGNITIVE_SECTIONS = [
    "logical_reasoning",
    "numerical_ability",
    "verbal_ability",
    "spatial_reasoning",
]

DIFFICULTY_WEIGHTS: dict[str, int] = {
    "easy": 1,
    "medium": 2,
    "hard": 3,
}

CANONICAL_RIASEC_ORDER = ["R", "I", "A", "S", "E", "C"]

INTEREST_TO_RIASEC: dict[str, dict[str, float]] = {
    "sports": {"R": 1.0},
    "maths": {"I": 1.0},
    "biology": {"I": 1.0},
    "coding": {"I": 1.0, "C": 0.5},
    "art": {"A": 1.0},
    "design": {"A": 1.0, "R": 0.5},
    "writing": {"A": 1.0},
    "music": {"A": 1.0},
    "social-work": {"S": 1.0},
    "teaching": {"S": 1.0},
    "business": {"E": 1.0, "C": 0.5},
    "law": {"E": 1.0},
}


def calculate_section_scores(
    answers: dict[str, str | None],
    questions: list[dict[str, Any]],
) -> dict[str, int]:
    """Calculate difficulty-weighted percentage correct (0-100) for each cognitive section.

    easy = 1, medium = 2, hard = 3. Unanswered or incorrect answers count as 0.
    """
    scores: dict[str, int] = {}

    for section_id in COGNITIVE_SECTIONS:
        sec_questions = [q for q in questions if q.get("section") == section_id]
        if not sec_questions:
            scores[section_id] = 0
            continue

        total_weight = 0
        earned_weight = 0

        for q in sec_questions:
            diff = str(q.get("difficulty", "easy")).lower()
            weight = DIFFICULTY_WEIGHTS.get(diff, 1)
            total_weight += weight

            q_id = q.get("id")
            selected = answers.get(q_id)
            correct = q.get("correctAnswer")

            if selected is not None and correct is not None and str(selected).strip() == str(correct).strip():
                earned_weight += weight

        if total_weight > 0:
            scores[section_id] = int(round((earned_weight / total_weight) * 100))
        else:
            scores[section_id] = 0

    return scores


def calculate_overall_score(section_scores: dict[str, int]) -> int:
    """Arithmetic mean of the four cognitive section scores, rounded to integer (0-100)."""
    values = [section_scores.get(sec, 0) for sec in COGNITIVE_SECTIONS]
    if not values:
        return 0
    return int(round(sum(values) / len(values)))


def calculate_riasec_scores(
    answers: dict[str, str | None],
    questions: list[dict[str, Any]],
) -> dict[str, int]:
    """Tally RIASEC points from the interest profile section.

    Each option selected awards 1 point to its corresponding riasecType.
    """
    scores: dict[str, int] = {k: 0 for k in CANONICAL_RIASEC_ORDER}

    interest_qs = [q for q in questions if q.get("section") == "interest_profile"]
    for q in interest_qs:
        q_id = q.get("id")
        selected = answers.get(q_id)
        if not selected:
            continue

        for opt in q.get("options", []):
            if isinstance(opt, dict) and str(opt.get("text", "")).strip() == str(selected).strip():
                riasec_type = opt.get("riasecType")
                if riasec_type in scores:
                    scores[riasec_type] += 1
                break

    return scores


def calculate_riasec_percents(riasec_scores: dict[str, int]) -> dict[str, int]:
    """Calculate percentage for each RIASEC type.

    Each type appears in exactly 8 interest questions; percentage is count / 8 * 100.
    """
    return {
        k: int(round((riasec_scores.get(k, 0) / 8.0) * 100))
        for k in CANONICAL_RIASEC_ORDER
    }


def get_student_interest_weights(interests: list[str] | None) -> dict[str, float]:
    """Sum interest weights mapped from the student's profile interests to RIASEC types."""
    weights: dict[str, float] = {k: 0.0 for k in CANONICAL_RIASEC_ORDER}
    if not interests:
        return weights

    for interest in interests:
        mapping = INTEREST_TO_RIASEC.get(interest.strip().lower(), {})
        for r_type, w in mapping.items():
            if r_type in weights:
                weights[r_type] += w

    return weights


def rank_riasec_types(
    riasec_percents: dict[str, int],
    profile_interests: list[str] | None = None,
) -> list[str]:
    """Sort RIASEC types deterministically.

    1. riasecPercent descending
    2. profile interest weights descending
    3. fixed canonical order R, I, A, S, E, C
    """
    interest_weights = get_student_interest_weights(profile_interests)

    def sort_key(t: str) -> tuple[int, float, int]:
        pct = riasec_percents.get(t, 0)
        i_weight = interest_weights.get(t, 0.0)
        canon_idx = CANONICAL_RIASEC_ORDER.index(t)
        return (-pct, -i_weight, canon_idx)

    return sorted(CANONICAL_RIASEC_ORDER, key=sort_key)


def get_top_riasec_types(
    riasec_percents: dict[str, int],
    profile_interests: list[str] | None = None,
    limit: int = 2,
) -> list[str]:
    """Return top N RIASEC types using deterministic tie-breaking."""
    ranked = rank_riasec_types(riasec_percents, profile_interests)
    return ranked[:limit]


def get_strengths_and_weaknesses(
    section_scores: dict[str, int],
) -> tuple[list[str], list[str], bool]:
    """Partition cognitive sections into strengths (>=60, best first) and weaknesses (<60, lowest first).

    Guarantees at least one entry in both lists. If forcing was required,
    returns strengths_are_relative = True.
    """
    sorted_desc = sorted(
        COGNITIVE_SECTIONS,
        key=lambda s: (-section_scores.get(s, 0), COGNITIVE_SECTIONS.index(s)),
    )
    sorted_asc = sorted(
        COGNITIVE_SECTIONS,
        key=lambda s: (section_scores.get(s, 0), COGNITIVE_SECTIONS.index(s)),
    )

    natural_strengths = [s for s in sorted_desc if section_scores.get(s, 0) >= 60]
    natural_weaknesses = [s for s in sorted_asc if section_scores.get(s, 0) < 60]

    strengths_are_relative = False

    if not natural_strengths:
        # All sections < 60: pick highest as relative strength
        strengths_are_relative = True
        best_section = sorted_desc[0]
        strengths = [best_section]
        weaknesses = [s for s in sorted_asc if s != best_section]
    elif not natural_weaknesses:
        # All sections >= 60: pick lowest as relative weakness
        strengths_are_relative = True
        lowest_section = sorted_asc[0]
        weaknesses = [lowest_section]
        strengths = [s for s in sorted_desc if s != lowest_section]
    else:
        strengths = natural_strengths
        weaknesses = natural_weaknesses

    return strengths, weaknesses, strengths_are_relative


def get_completed_at() -> str:
    """Return current UTC timestamp formatted as ISO 8601 with trailing Z."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

