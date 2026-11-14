"""Holland Hexagon RIASEC vector modeling and cosine similarity calculations.

Holland's Hexagon represents RIASEC types in circular order: R - I - A - S - E - C.
Types that are adjacent on the hexagon are psychologically more closely related.
"""

from __future__ import annotations

import math

HEXAGON_ORDER: list[str] = ["R", "I", "A", "S", "E", "C"]


def get_hexagon_neighbors(riasec_type: str) -> tuple[str, str]:
    """Return the two immediate circular neighbors of a RIASEC type on Holland's Hexagon."""
    t = riasec_type.strip().upper()
    if t not in HEXAGON_ORDER:
        raise ValueError(f"Unknown RIASEC type: {riasec_type}")
    idx = HEXAGON_ORDER.index(t)
    left = HEXAGON_ORDER[(idx - 1) % len(HEXAGON_ORDER)]
    right = HEXAGON_ORDER[(idx + 1) % len(HEXAGON_ORDER)]
    return left, right


def build_career_riasec_vector(riasec_types: list[str]) -> dict[str, float]:
    """Construct a 6-dimensional RIASEC vector for a career on Holland's hexagon.

    # TREAT ARRAY ORDER IN careers.js AS IMPORTANCE (first item first):
    # riasecTypes[0] is primary (weight 1.0), riasecTypes[1] is secondary (weight 0.7).
    # The two hexagon neighbours of the first type get 0.25 (only if not already set).
    # All others get 0.0.
    """
    vector: dict[str, float] = {t: 0.0 for t in HEXAGON_ORDER}
    if not riasec_types:
        return vector

    # First type = 1.0
    first_type = riasec_types[0].strip().upper()
    if first_type in vector:
        vector[first_type] = 1.0

    # Second type = 0.7 (if present)
    if len(riasec_types) > 1:
        second_type = riasec_types[1].strip().upper()
        if second_type in vector and vector[second_type] == 0.0:
            vector[second_type] = 0.7

    # Two hexagon neighbours of first type = 0.25 (only if not already set)
    if first_type in HEXAGON_ORDER:
        left, right = get_hexagon_neighbors(first_type)
        if vector[left] == 0.0:
            vector[left] = 0.25
        if vector[right] == 0.0:
            vector[right] = 0.25

    return vector


def calculate_cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Calculate cosine similarity between two equal-length vectors, bounded between 0.0 and 1.0."""
    if len(vec_a) != len(vec_b) or not vec_a:
        return 0.0

    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    similarity = dot / (norm_a * norm_b)
    # Bound to [0.0, 1.0] for non-negative vectors
    return max(0.0, min(1.0, similarity))


def calculate_interest_fit(
    student_riasec_percent: dict[str, int | float],
    career_riasec_types: list[str],
) -> float:
    """Calculate interestFit (0.0 to 100.0) using cosine similarity on Holland's hexagon."""
    career_vector = build_career_riasec_vector(career_riasec_types)
    u = [float(student_riasec_percent.get(t, 0.0)) for t in HEXAGON_ORDER]
    v = [career_vector[t] for t in HEXAGON_ORDER]

    similarity = calculate_cosine_similarity(u, v)
    return similarity * 100.0

