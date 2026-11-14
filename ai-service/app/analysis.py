"""Deterministic student analysis and insight generation.

Generates additive analysis metrics, quality indicators, academic signal comparisons,
and age-appropriate template summaries for Class 8-12 students.
"""

from __future__ import annotations

from typing import Any

from app.schemas import Language, StudentProfile, SubjectMarks

SECTION_NAMES: dict[str, dict[str, str]] = {
    "logical_reasoning": {
        "en": "Logical Reasoning",
        "hi": "तार्किक क्षमता (Logical Reasoning)",
    },
    "numerical_ability": {
        "en": "Numerical Ability",
        "hi": "गणितीय क्षमता (Numerical Ability)",
    },
    "verbal_ability": {
        "en": "Verbal Ability",
        "hi": "भाषाई समझ (Verbal Ability)",
    },
    "spatial_reasoning": {
        "en": "Spatial Reasoning",
        "hi": "स्थानिक समझ (Spatial Reasoning)",
    },
}

RIASEC_NAMES: dict[str, dict[str, str]] = {
    "R": {
        "en": "Realistic (hands-on & practical)",
        "hi": "व्यावहारिक (Realistic)",
    },
    "I": {
        "en": "Investigative (analytical & scientific)",
        "hi": "विश्लेषणात्मक व वैज्ञानिक (Investigative)",
    },
    "A": {
        "en": "Artistic (creative & expressive)",
        "hi": "रचनात्मक व कलात्मक (Artistic)",
    },
    "S": {
        "en": "Social (helping & collaborative)",
        "hi": "सामाजिक व मार्गदर्शक (Social)",
    },
    "E": {
        "en": "Enterprising (leadership & business)",
        "hi": "उद्यमी व नेतृत्व (Enterprising)",
    },
    "C": {
        "en": "Conventional (structured & detail-oriented)",
        "hi": "व्यवस्थित व सटीक (Conventional)",
    },
}

SUBJECT_TO_SECTION_MAP: dict[str, str] = {
    "maths": "numerical_ability",
    "english": "verbal_ability",
    "science": "logical_reasoning",
    "computer": "logical_reasoning",
    "socialScience": "verbal_ability",
    "secondLanguage": "verbal_ability",
}


def calculate_completion_and_quality(
    answers: dict[str, str | None],
    questions: list[dict[str, Any]],
) -> tuple[float, str]:
    """Calculate completion ratio and assessment quality.

    - completion = answered questions / 36
    - quality = 'low' if completion < 0.8 or if any single option position
      (e.g., A, B, C, or D) was chosen for >= 90% of answered questions; else 'ok'.
    """
    total_questions = len(questions) if questions else 36
    answered_count = 0
    position_counts: dict[int, int] = {}

    for q in questions:
        q_id = q.get("id")
        selected = answers.get(q_id)
        if selected is None or str(selected).strip() == "":
            continue

        answered_count += 1
        options = q.get("options", [])

        # Identify which option position (0, 1, 2, 3...) was picked
        picked_idx: int | None = None
        for idx, opt in enumerate(options):
            if isinstance(opt, dict):
                opt_text = opt.get("text", "")
            else:
                opt_text = str(opt)

            if str(opt_text).strip() == str(selected).strip():
                picked_idx = idx
                break

        if picked_idx is not None:
            position_counts[picked_idx] = position_counts.get(picked_idx, 0) + 1

    completion = round(answered_count / total_questions, 2) if total_questions > 0 else 0.0

    is_low_quality = False
    if completion < 0.8:
        is_low_quality = True
    elif answered_count > 0:
        for count in position_counts.values():
            if (count / answered_count) >= 0.90:
                is_low_quality = True
                break

    quality = "low" if is_low_quality else "ok"
    return completion, quality


def calculate_academic_signals(
    subject_marks: SubjectMarks | dict[str, Any] | None,
    section_scores: dict[str, int],
    language: Language = "en",
) -> list[dict[str, Any]]:
    """Compare subject marks to test section scores.

    Flags sections where average marks and test score differ by >= 25 points,
    with an encouraging note that test scores are snapshot measurements while
    marks reflect cumulative study.
    """
    if not subject_marks:
        return []

    marks_dict: dict[str, Any]
    if isinstance(subject_marks, SubjectMarks):
        marks_dict = subject_marks.model_dump(exclude_none=True)
    elif isinstance(subject_marks, dict):
        marks_dict = {k: v for k, v in subject_marks.items() if v is not None}
    else:
        return []

    # Group marks by mapped cognitive section
    section_marks: dict[str, list[int]] = {}
    for subject, mark in marks_dict.items():
        if isinstance(mark, (int, float)) and subject in SUBJECT_TO_SECTION_MAP:
            target_sec = SUBJECT_TO_SECTION_MAP[subject]
            section_marks.setdefault(target_sec, []).append(int(round(mark)))

    signals: list[dict[str, Any]] = []

    note_text = (
        "School marks reflect months of consistent curriculum work, while this test is a brief snapshot; a divergence of 25+ points is normal and worth discussing with a mentor."
        if language == "en"
        else "स्कूल के अंक महीनों के नियमित अध्ययन को दर्शाते हैं, जबकि यह टेस्ट एक संक्षिप्त मूल्यांकन है; 25 से अधिक अंकों का अंतर सामान्य और स्वाभाविक है।"
    )

    for section_id, marks_list in section_marks.items():
        if not marks_list:
            continue
        avg_mark = int(round(sum(marks_list) / len(marks_list)))
        test_score = section_scores.get(section_id, 0)
        diff = abs(test_score - avg_mark)

        if diff >= 25:
            signals.append({
                "section": section_id,
                "schoolMarksAvg": avg_mark,
                "testScore": test_score,
                "difference": test_score - avg_mark,
                "note": note_text,
            })

    return signals


def generate_profile_summary(
    overall_score: int,
    strengths: list[str],
    top_types: list[str],
    language: Language = "en",
) -> str:
    """Generate 2 plain sentences for a 13-18 year old from deterministic templates."""
    top_strength = strengths[0] if strengths else "logical_reasoning"
    strength_label = SECTION_NAMES.get(top_strength, {}).get(language, top_strength.replace("_", " ").title())

    t1 = top_types[0] if len(top_types) > 0 else "I"
    t2 = top_types[1] if len(top_types) > 1 else "A"
    t1_label = RIASEC_NAMES.get(t1, {}).get(language, t1)
    t2_label = RIASEC_NAMES.get(t2, {}).get(language, t2)

    if language == "hi":
        s1 = f"आपने {strength_label} में उत्कृष्ट क्षमता दिखाई और आपका समग्र बौद्धिक स्कोर {overall_score}% रहा।"
        s2 = f"आपकी प्राथमिक रुचियां {t1_label} और {t2_label} गतिविधियों से मेल खाती हैं, जो आपके लिए सशक्त करियर दिशाओं का संकेत देती हैं।"
    else:
        s1 = f"You showed strong capability in {strength_label}, achieving an overall cognitive score of {overall_score}% across all sections."
        s2 = f"Your interests align prominently with {t1_label} and {t2_label} activities, pointing toward promising career paths in these directions."

    return f"{s1} {s2}"


def build_analysis(
    section_scores: dict[str, int],
    riasec_percents: dict[str, int],
    top_types: list[str],
    strengths: list[str],
    strengths_are_relative: bool,
    answers: dict[str, str | None],
    questions: list[dict[str, Any]],
    profile: StudentProfile | None,
    language: Language = "en",
) -> dict[str, Any]:
    """Assemble the additive analysis dictionary."""
    # 1. Holland code: top 3 RIASEC letters
    from app.scoring import rank_riasec_types

    ranked_types = rank_riasec_types(
        riasec_percents,
        profile.interests if profile else None,
    )
    holland_code = "".join(ranked_types[:3])

    # 2. Interest clarity: 'clear' if 2nd and 3rd riasecPercent differ by >= 15, else 'mixed'
    sorted_percents = sorted(riasec_percents.values(), reverse=True)
    p2 = sorted_percents[1] if len(sorted_percents) > 1 else 0
    p3 = sorted_percents[2] if len(sorted_percents) > 2 else 0
    interest_clarity = "clear" if (p2 - p3) >= 15 else "mixed"

    # 3. Cognitive balance: highest minus lowest section score
    sec_values = list(section_scores.values())
    cognitive_balance = (max(sec_values) - min(sec_values)) if sec_values else 0

    # 4. Completion & Quality
    completion, quality = calculate_completion_and_quality(answers, questions)

    # 5. Academic signals
    subject_marks = profile.subjectMarks if profile else None
    academic_signals = calculate_academic_signals(subject_marks, section_scores, language)

    # 6. Profile summary
    overall_score = int(round(sum(sec_values) / len(sec_values))) if sec_values else 0
    profile_summary = generate_profile_summary(overall_score, strengths, top_types, language)

    return {
        "hollandCode": holland_code,
        "interestClarity": interest_clarity,
        "cognitiveBalance": cognitive_balance,
        "completion": completion,
        "quality": quality,
        "academicSignals": academic_signals,
        "profileSummary": profile_summary,
        "strengthsAreRelative": strengths_are_relative,
        "riasecPercent": riasec_percents,
    }

