"""Deterministic Context Builder for PathFinder AI Counsellor.

Constructs a compact context block (~1,500 tokens) from the student profile,
assessment results, top careers, and retrieves up to 3 relevant career records
from data/careers.json by matching titles, streams, or skills.
"""

from __future__ import annotations

import re
from typing import Any

from app.chatbot import format_salary_range
from app.data_loader import get_careers
from app.schemas import ChatTurn


def _format_salary_text(salary_dict: dict[str, Any] | None) -> str:
    if not salary_dict or not isinstance(salary_dict, dict):
        return "Not available"
    parts = []
    if "entry" in salary_dict:
        parts.append(f"Entry: {format_salary_range(salary_dict['entry'])}")
    if "mid" in salary_dict:
        parts.append(f"Mid: {format_salary_range(salary_dict['mid'])}")
    if "senior" in salary_dict:
        parts.append(f"Senior: {format_salary_range(salary_dict['senior'])}")
    return ", ".join(parts) if parts else "Not available"


def retrieve_relevant_careers(
    message: str,
    history: list[ChatTurn],
    careers: list[dict[str, Any]],
    top_careers: list[dict[str, Any]] | None = None,
    max_careers: int = 3,
) -> list[dict[str, Any]]:
    """Retrieve up to max_careers career records matching words in message and history."""
    corpus_text = message.lower()
    for turn in history[-4:]:
        corpus_text += " " + turn.content.lower()

    scored_careers: list[tuple[int, dict[str, Any]]] = []

    for c in careers:
        score = 0
        cid = c.get("id", "").lower()
        title = c.get("title", "").lower()
        stream = c.get("stream", "").lower()
        skills = [s.lower() for s in c.get("skills", [])]

        # Exact title or id match gives high score
        if re.search(rf"\b{re.escape(cid)}\b", corpus_text) or re.search(rf"\b{re.escape(title)}\b", corpus_text):
            score += 10

        # Stream match
        if stream and re.search(rf"\b{re.escape(stream)}\b", corpus_text):
            score += 4

        # Skill match
        for sk in skills:
            if re.search(rf"\b{re.escape(sk)}\b", corpus_text):
                score += 2

        if score > 0:
            scored_careers.append((score, c))

    scored_careers.sort(key=lambda x: x[0], reverse=True)
    matched = [c for _, c in scored_careers[:max_careers]]

    # If no careers matched from keywords, fall back to the top careers from assessment
    if not matched and top_careers:
        careers_by_id = {c["id"]: c for c in careers}
        for tc in top_careers[:max_careers]:
            cid = tc.get("id") or tc.get("careerId")
            if cid and cid in careers_by_id:
                matched.append(careers_by_id[cid])

    return matched[:max_careers]


def build_counsellor_context(
    message: str,
    history: list[ChatTurn],
    context: dict[str, Any] | None = None,
) -> str:
    """Build a deterministic, grounded context block (~1,500 tokens)."""
    ctx = context or {}
    profile = ctx.get("profile") or {}
    result = ctx.get("result") or ctx.get("testResult") or {}
    top_careers = ctx.get("topCareers") or []

    careers = get_careers()
    relevant_careers = retrieve_relevant_careers(message, history, careers, top_careers, max_careers=3)

    sections: list[str] = []

    # 1. Student Profile
    p_lines: list[str] = ["### STUDENT PROFILE"]
    s_class = profile.get("class") or profile.get("student_class")
    if s_class:
        p_lines.append(f"- Class: {s_class}")
    if profile.get("board"):
        p_lines.append(f"- Board: {profile.get('board')}")
    if profile.get("state"):
        p_lines.append(f"- State: {profile.get('state')}")
    if profile.get("interests"):
        p_lines.append(f"- Interests: {', '.join(profile.get('interests'))}")

    marks = profile.get("subjectMarks")
    if marks and isinstance(marks, dict):
        marks_str = ", ".join(f"{k}: {v}" for k, v in marks.items() if v is not None)
        if marks_str:
            p_lines.append(f"- Subject Marks (0–100): {marks_str}")
    sections.append("\n".join(p_lines))

    # 2. Assessment Results
    r_lines: list[str] = ["### APTITUDE & ASSESSMENT RESULTS"]
    if result.get("overallScore") is not None:
        r_lines.append(f"- Overall Score: {result.get('overallScore')}%")

    sec_scores = result.get("sectionScores")
    if sec_scores and isinstance(sec_scores, dict):
        sec_str = ", ".join(f"{k}: {v}%" for k, v in sec_scores.items())
        r_lines.append(f"- Section Scores: {sec_str}")

    analysis = result.get("analysis") or {}
    if analysis.get("hollandCode"):
        r_lines.append(f"- Holland Code (RIASEC): {analysis.get('hollandCode')}")

    if result.get("strengths"):
        r_lines.append(f"- Strengths: {', '.join(result.get('strengths'))}")
    if result.get("weaknesses"):
        r_lines.append(f"- Areas to Develop: {', '.join(result.get('weaknesses'))}")

    sections.append("\n".join(r_lines))

    # 3. Top 5 Careers
    if top_careers:
        tc_lines: list[str] = ["### TOP RECOMMENDED CAREERS"]
        for idx, tc in enumerate(top_careers[:5], start=1):
            if isinstance(tc, str):
                tc_lines.append(f"{idx}. {tc}")
            elif isinstance(tc, dict):
                title = tc.get("title") or tc.get("id", "Career")
                match_pct = tc.get("matchPct") or tc.get("match")
                reasons = tc.get("reasons") or []
                reasons_str = f" — {'; '.join(reasons[:2])}" if reasons else ""
                match_str = f" ({match_pct}% match)" if match_pct is not None else ""
                tc_lines.append(f"{idx}. {title}{match_str}{reasons_str}")
        sections.append("\n".join(tc_lines))

    # 4. Relevant Career Records
    if relevant_careers:
        cr_lines: list[str] = ["### CAREER RECORDS (GROUNDED FACTS)"]
        for c in relevant_careers:
            cr_lines.append(f"Career: {c.get('title')} (ID: {c.get('id')})")
            cr_lines.append(f"- Stream: {c.get('stream', 'General')}")
            skills = ", ".join(c.get("skills", [])[:5])
            if skills:
                cr_lines.append(f"- Key Skills: {skills}")

            salary_str = _format_salary_text(c.get("salary"))
            cr_lines.append(f"- Salary Bracket (INR): {salary_str}")

            raw_exams = c.get("entranceExams", [])
            exams = ", ".join(e["name"] if isinstance(e, dict) else str(e) for e in raw_exams[:4])
            if exams:
                cr_lines.append(f"- Entrance Exams: {exams}")

            colleges = ", ".join(c.get("topColleges", [])[:4])
            if colleges:
                cr_lines.append(f"- Top Colleges: {colleges}")

            roadmap_titles = ", ".join(s.get("title", "") for s in c.get("roadmap", []) if s.get("title"))
            if roadmap_titles:
                cr_lines.append(f"- Roadmap Milestones: {roadmap_titles}")
            cr_lines.append("")

        sections.append("\n".join(cr_lines).strip())

    return "\n\n".join(sections)

