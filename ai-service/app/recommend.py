"""Career recommendation engine combining Holland's RIASEC hexagon, aptitude, academic, and stated interests.

# TREAT ARRAY ORDER IN careers.js AS IMPORTANCE (first item first):
# 1. requiredAptitudes[0] is primary (weight 0.6), requiredAptitudes[1] is secondary (weight 0.4).
# 2. riasecTypes[0] is primary (weight 1.0), riasecTypes[1] is secondary (weight 0.7).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.analysis import RIASEC_NAMES, SECTION_NAMES
from app.data_loader import get_careers
from app.hexagon import calculate_interest_fit
from app.schemas import AssessResult, Language, StudentProfile, SubjectMarks
from app.weights import W_ACADEMIC, W_APTITUDE, W_INTEREST, W_STATED

_ENRICHMENT_PATH = Path(__file__).resolve().parent.parent / "data" / "career_enrichment.json"
_career_enrichment: dict[str, dict[str, float]] | None = None

MARKS_TO_SECTION_MAP: dict[str, str] = {
    "maths": "numerical_ability",
    "english": "verbal_ability",
    "science": "logical_reasoning",
    "computer": "logical_reasoning",
    "socialScience": "verbal_ability",
    "secondLanguage": "verbal_ability",
}


def get_career_enrichment() -> dict[str, dict[str, float]]:
    """Load the interest tags to career strengths enrichment mapping."""
    global _career_enrichment
    if _career_enrichment is None:
        if not _ENRICHMENT_PATH.is_file():
            _career_enrichment = {}
        else:
            with _ENRICHMENT_PATH.open(encoding="utf-8") as f:
                _career_enrichment = json.load(f)
    return _career_enrichment


def calculate_aptitude_fit(
    career_required_aptitudes: list[str],
    section_scores: dict[str, int],
) -> float:
    """Calculate aptitudeFit (0.0 to 100.0) from the career's two required aptitudes.

    # TREAT ARRAY ORDER IN careers.js AS IMPORTANCE (first item first):
    - 0.6 x the first requiredAptitudes section score + 0.4 x the second.
    - If any required section is under 40, cap aptitudeFit at 60.0.
    """
    if not career_required_aptitudes:
        return 50.0

    s1_name = career_required_aptitudes[0]
    s2_name = career_required_aptitudes[1] if len(career_required_aptitudes) > 1 else s1_name

    s1 = section_scores.get(s1_name, 0)
    s2 = section_scores.get(s2_name, 0)

    raw_fit = (0.6 * s1) + (0.4 * s2)

    if s1 < 40 or s2 < 40:
        return min(raw_fit, 60.0)
    return raw_fit


def get_section_academic_marks(
    subject_marks: SubjectMarks | dict[str, Any] | None,
) -> dict[str, float]:
    """Map student's subject marks to cognitive sections by averaging mapped subjects."""
    if not subject_marks:
        return {}

    marks_dict: dict[str, Any]
    if isinstance(subject_marks, SubjectMarks):
        marks_dict = subject_marks.model_dump(exclude_none=True)
    elif isinstance(subject_marks, dict):
        marks_dict = {k: v for k, v in subject_marks.items() if v is not None}
    else:
        return {}

    section_marks_lists: dict[str, list[float]] = {}
    for subject, mark in marks_dict.items():
        if isinstance(mark, (int, float)) and subject in MARKS_TO_SECTION_MAP:
            target_sec = MARKS_TO_SECTION_MAP[subject]
            section_marks_lists.setdefault(target_sec, []).append(float(mark))

    return {
        sec: (sum(m_list) / len(m_list))
        for sec, m_list in section_marks_lists.items()
        if m_list
    }


def calculate_academic_fit(
    career_required_aptitudes: list[str],
    section_marks: dict[str, float],
) -> float | None:
    """Calculate academicFit (0.0 to 100.0) when marks are present.

    # TREAT ARRAY ORDER IN careers.js AS IMPORTANCE (first item first):
    - Uses 0.6 for the first required section and 0.4 for the second required section.
    - If marks are only available for one section, uses that section's mark.
    - If neither section has marks, returns None.
    """
    if not section_marks or not career_required_aptitudes:
        return None

    s1_name = career_required_aptitudes[0]
    s2_name = career_required_aptitudes[1] if len(career_required_aptitudes) > 1 else s1_name

    has_m1 = s1_name in section_marks
    has_m2 = s2_name in section_marks

    if has_m1 and has_m2:
        return (0.6 * section_marks[s1_name]) + (0.4 * section_marks[s2_name])
    elif has_m1:
        return section_marks[s1_name]
    elif has_m2:
        return section_marks[s2_name]
    return None


def calculate_stated_interest_fit(
    career_id: str,
    interests: list[str] | None,
    enrichment: dict[str, dict[str, float]],
) -> float | None:
    """Calculate statedInterestFit (0.0 to 100.0) from profile.interests.

    Returns None if profile.interests is None or empty.
    """
    if not interests:
        return None

    strengths: list[float] = []
    for tag in interests:
        t = tag.strip().lower()
        if t in enrichment and career_id in enrichment[t]:
            strengths.append(enrichment[t][career_id])

    if strengths:
        return max(strengths) * 100.0
    return 0.0


def determine_confidence(
    quality: str,
    interest_clarity: str,
    marks_supplied: bool,
) -> str:
    """Determine recommendation confidence: 'high', 'medium', or 'low'.

    - Quality 'low' -> 'low'.
    - Quality 'ok', but interestClarity is 'mixed' AND marks were not supplied -> 'low'.
    - Quality 'ok', interestClarity 'clear', and marks supplied -> 'high'.
    - Otherwise -> 'medium'.
    """
    if quality == "low":
        return "low"
    if interest_clarity == "mixed" and not marks_supplied:
        return "low"
    if interest_clarity == "clear" and marks_supplied:
        return "high"
    return "medium"


def generate_career_reasons(
    career: dict[str, Any],
    section_scores: dict[str, int],
    language: Language = "en",
) -> list[str]:
    """Generate up to 3 short template sentences citing student's real numbers."""
    reasons: list[str] = []
    title = career.get("title", "this career")
    req_aptitudes = career.get("requiredAptitudes", [])
    riasec_types = career.get("riasecTypes", [])

    if req_aptitudes:
        s1_name = req_aptitudes[0]
        s1_score = section_scores.get(s1_name, 0)
        s1_label = SECTION_NAMES.get(s1_name, {}).get(language, s1_name.replace("_", " ").title())
        if language == "hi":
            reasons.append(f"{title} के लिए आवश्यक {s1_label} में आपका {s1_score}% स्कोर बहुत प्रभावशाली है।")
        else:
            reasons.append(f"Your {s1_label} score of {s1_score}% strongly aligns with the core requirements of {title}.")

    if len(req_aptitudes) > 1:
        s2_name = req_aptitudes[1]
        s2_score = section_scores.get(s2_name, 0)
        s2_label = SECTION_NAMES.get(s2_name, {}).get(language, s2_name.replace("_", " ").title())
        if s2_score >= 60:
            if language == "hi":
                reasons.append(f"{s2_label} में आपका {s2_score}% स्कोर इस क्षेत्र में आपकी सफलता को अतिरिक्त मजबूती देता है।")
            else:
                reasons.append(f"Your {s2_label} score of {s2_score}% gives you a solid foundation for this domain.")

    if riasec_types and len(reasons) < 3:
        t1 = riasec_types[0]
        t1_label = RIASEC_NAMES.get(t1, {}).get(language, t1)
        if language == "hi":
            reasons.append(f"आपकी {t1_label} रुचि इस करियर की प्रकृति और जिम्मेदारियों से पूरी तरह मेल खाती है।")
        else:
            reasons.append(f"Your strong alignment with {t1_label} work matches the daily practice of {title}.")

    return reasons[:3]


def generate_career_gaps(
    career: dict[str, Any],
    section_scores: dict[str, int],
    language: Language = "en",
) -> list[str]:
    """List required sections scoring under 50, each with its score."""
    gaps: list[str] = []
    req_aptitudes = career.get("requiredAptitudes", [])
    for sec in req_aptitudes:
        score = section_scores.get(sec, 0)
        if score < 50:
            label = SECTION_NAMES.get(sec, {}).get(language, sec.replace("_", " ").title())
            if language == "hi":
                gaps.append(f"{label}: {score}% (50%+ का लक्ष्य अनुशंसित)")
            else:
                gaps.append(f"{label}: {score}% (recommended target is 50%+)")
    return gaps


def select_top_picks(
    ranked_careers: list[dict[str, Any]],
    careers_by_id: dict[str, dict[str, Any]],
    limit: int = 5,
    max_per_stream: int = 2,
) -> list[str]:
    """Select top 5 career ids with at most 2 per stream, preserving diversity."""
    top_picks: list[str] = []
    stream_counts: dict[str, int] = {}

    for item in ranked_careers:
        c_id = item["id"]
        career_meta = careers_by_id.get(c_id, {})
        stream = career_meta.get("stream", "Other")

        if stream_counts.get(stream, 0) < max_per_stream:
            top_picks.append(c_id)
            stream_counts[stream] = stream_counts.get(stream, 0) + 1
            if len(top_picks) == limit:
                break

    return top_picks


def recommend_careers(
    result: AssessResult,
    profile: StudentProfile | None = None,
    language: Language = "en",
) -> dict[str, Any]:
    """Generate career recommendations scored across interest, aptitude, academic, and stated interests."""
    careers = get_careers()
    enrichment = get_career_enrichment()
    careers_by_id = {c["id"]: c for c in careers}

    # Student vectors and scores
    section_scores = result.sectionScores
    riasec_percents = result.riasecPercent or {}
    if not riasec_percents and result.riasecScores:
        # Fallback if riasecPercent was not populated
        from app.scoring import calculate_riasec_percents
        riasec_percents = calculate_riasec_percents(result.riasecScores)

    # Subject marks mapping
    subject_marks = profile.subjectMarks if profile else None
    section_marks = get_section_academic_marks(subject_marks)
    marks_supplied = bool(section_marks)

    # Stated interests
    interests = profile.interests if profile else None

    # Analysis flags
    analysis = result.analysis or {}
    quality = analysis.get("quality", "ok")
    interest_clarity = analysis.get("interestClarity", "clear")
    confidence = determine_confidence(quality, interest_clarity, marks_supplied)

    scored_list: list[dict[str, Any]] = []

    for c in careers:
        c_id = c["id"]
        riasec_types = c.get("riasecTypes", [])
        req_aptitudes = c.get("requiredAptitudes", [])

        # 1. interestFit
        interest_fit = calculate_interest_fit(riasec_percents, riasec_types)

        # 2. aptitudeFit
        aptitude_fit = calculate_aptitude_fit(req_aptitudes, section_scores)

        # 3. academicFit (only if marks supplied)
        academic_fit = calculate_academic_fit(req_aptitudes, section_marks)

        # 4. statedInterestFit (only if interests supplied)
        stated_fit = calculate_stated_interest_fit(c_id, interests, enrichment)

        # Combine with weight rescaling
        active_weights: list[tuple[float, float]] = [
            (interest_fit, W_INTEREST),
            (aptitude_fit, W_APTITUDE),
        ]
        if academic_fit is not None:
            active_weights.append((academic_fit, W_ACADEMIC))
        if stated_fit is not None:
            active_weights.append((stated_fit, W_STATED))

        total_w = sum(w for _, w in active_weights)
        unrounded_score = sum((val * (w / total_w)) for val, w in active_weights) if total_w > 0 else 0.0
        match_pct = int(round(unrounded_score))

        breakdown = {
            "interestFit": round(interest_fit, 1),
            "aptitudeFit": round(aptitude_fit, 1),
            "academicFit": round(academic_fit, 1) if academic_fit is not None else None,
            "statedInterestFit": round(stated_fit, 1) if stated_fit is not None else None,
        }

        reasons = generate_career_reasons(c, section_scores, language)
        gaps = generate_career_gaps(c, section_scores, language)

        scored_list.append({
            "id": c_id,
            "unroundedScore": unrounded_score,
            "matchPct": match_pct,
            "breakdown": breakdown,
            "reasons": reasons,
            "gaps": gaps,
            "confidence": confidence,
        })

    # Sort on unrounded score descending, then on career id ascending for determinism
    scored_list.sort(key=lambda x: (-x["unroundedScore"], x["id"]))

    # Assign ranks and drop unroundedScore
    ranked_careers: list[dict[str, Any]] = []
    for rank_idx, item in enumerate(scored_list, start=1):
        ranked_careers.append({
            "id": item["id"],
            "rank": rank_idx,
            "matchPct": item["matchPct"],
            "breakdown": item["breakdown"],
            "reasons": item["reasons"],
            "gaps": item["gaps"],
            "confidence": item["confidence"],
        })

    top_picks = select_top_picks(ranked_careers, careers_by_id, limit=5, max_per_stream=2)

    return {
        "careers": ranked_careers,
        "topPicks": top_picks,
        "hasResults": True,
    }

