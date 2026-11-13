#!/usr/bin/env python3
"""Simulation script running 5,000 synthetic students against old and new recommendation engines.

Compares:
1. Diversity of #1 recommended careers (whether all 20 careers can achieve #1 rank).
2. Displayed #1/#2 tie rate (where the top two careers share the exact same match percentage).
"""

from __future__ import annotations

import random
import sys
import time
from pathlib import Path

# Add project root to sys.path so app modules import cleanly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_loader import get_careers, get_questions, load_data
from app.recommend import recommend_careers
from app.schemas import AssessResult
from app.scoring import (
    calculate_overall_score,
    calculate_riasec_percents,
    calculate_riasec_scores,
    calculate_section_scores,
    get_top_riasec_types,
)


def run_old_formula(
    careers: list[dict],
    section_scores: dict[str, int],
    riasec_scores: dict[str, int],
) -> list[tuple[str, int]]:
    """Legacy 50/50 formula from frontend/src/services/api.js."""
    results: list[tuple[str, int]] = []
    for c in careers:
        riasec_pts = sum(riasec_scores.get(t, 0) for t in c.get("riasecTypes", []))
        riasec_match = min(100, round((riasec_pts / 12) * 100))
        req = c.get("requiredAptitudes", [])
        apt_match = round(sum(section_scores.get(a, 0) for a in req) / len(req)) if req else 50
        match_pct = round(0.5 * riasec_match + 0.5 * apt_match)
        results.append((c["id"], match_pct))
    results.sort(key=lambda x: -x[1])
    return results


def simulate(n: int = 5000, seed: int = 42) -> dict[str, float]:
    """Run simulation on N random student test completions."""
    load_data()
    careers = get_careers()
    questions = get_questions()

    rng = random.Random(seed)

    old_ties = 0
    old_top1_careers: set[str] = set()

    new_ties = 0
    new_top1_careers: set[str] = set()

    start_time = time.time()

    for _ in range(n):
        answers: dict[str, str | None] = {}
        for q in questions:
            opts = q.get("options", [])
            if q.get("section") == "interest_profile":
                answers[q["id"]] = rng.choice(opts)["text"]
            else:
                answers[q["id"]] = rng.choice(opts)

        sec_scores = calculate_section_scores(answers, questions)
        riasec_scores = calculate_riasec_scores(answers, questions)
        riasec_pct = calculate_riasec_percents(riasec_scores)

        # 1. Evaluate Old Formula
        old_res = run_old_formula(careers, sec_scores, riasec_scores)
        old_top1_careers.add(old_res[0][0])
        if old_res[0][1] == old_res[1][1]:
            old_ties += 1

        # 2. Evaluate New Recommendation Engine
        assess_res = AssessResult(
            overallScore=calculate_overall_score(sec_scores),
            sectionScores=sec_scores,
            riasecScores=riasec_scores,
            riasecPercent=riasec_pct,
            topTypes=get_top_riasec_types(riasec_pct),
            strengths=["logical_reasoning"],
            weaknesses=["verbal_ability"],
            completedAt="2026-11-10T00:00:00Z",
        )
        new_res = recommend_careers(assess_res, profile=None)
        c_list = new_res["careers"]
        new_top1_careers.add(c_list[0]["id"])
        if c_list[0]["matchPct"] == c_list[1]["matchPct"]:
            new_ties += 1

    elapsed = time.time() - start_time

    old_tie_rate = (old_ties / n) * 100.0
    new_tie_rate = (new_ties / n) * 100.0

    all_career_ids = {c["id"] for c in careers}
    never_ranked_old = all_career_ids - old_top1_careers

    print(f"\n================ RECOMMENDATION SIMULATION RESULTS (N={n}) ================")
    print(f"Elapsed Time: {elapsed:.2f}s")
    print("\n--- Legacy Formula ---")
    print(f"Displayed #1/#2 Tie Rate: {old_tie_rate:.1f}%")
    print(f"Careers Ranked #1:       {len(old_top1_careers)}/20 (never ranked 1st: {len(never_ranked_old)})")
    if never_ranked_old:
        print(f"Missing Careers:         {sorted(never_ranked_old)}")

    print("\n--- New 4-Part Hexagon Recommendation Engine ---")
    print(f"Displayed #1/#2 Tie Rate: {new_tie_rate:.1f}% (target: < 25%)")
    print(f"Careers Ranked #1:       {len(new_top1_careers)}/20 (target: 20/20)")
    print("=========================================================================\n")

    # Assertions required by the task
    assert len(new_top1_careers) == 20, (
        f"Expected all 20 careers to rank #1, but only {len(new_top1_careers)} did: "
        f"Missing: {all_career_ids - new_top1_careers}"
    )
    assert new_tie_rate < 25.0, f"Expected tie rate < 25%, but got {new_tie_rate:.1f}%"

    return {
        "old_tie_rate": old_tie_rate,
        "new_tie_rate": new_tie_rate,
        "old_unique_top1": len(old_top1_careers),
        "new_unique_top1": len(new_top1_careers),
    }


if __name__ == "__main__":
    simulate()

