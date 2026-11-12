"""Personalised career roadmap engine (POST /ai/roadmap).

Tailors canonical 7-step career milestones to a student's current grade (Class 8-12),
injects weak-aptitude bridge steps using SECTION_TIPS, evaluates stream marks gates,
generates grade-specific stream advice, and maps entrance exam preparation timelines.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.analysis import SECTION_NAMES
from app.data_loader import get_careers
from app.llm_client import generate_completion
from app.recommend import recommend_careers
from app.schemas import (
    AssessResult,
    Language,
    RoadmapRequest,
    RoadmapResponse,
    RoadmapStep,
    StudentProfile,
    SubjectMarks,
)

# Study tips copied directly from frontend/src/pages/Results.jsx
SECTION_TIPS: dict[str, list[str]] = {
    "logical_reasoning": [
        "Practise puzzle types like number series, analogies and syllogisms for 15 minutes every day.",
        "Solve one new riddle or brain-teaser each morning to sharpen pattern recognition.",
        "Work through past reasoning papers from exams like NTSE, KVPY or Olympiads.",
    ],
    "numerical_ability": [
        "Practise mental maths daily: tables up to 25, percentage shortcuts and fraction conversions.",
        "Spend 10 minutes each day on speed maths apps or textbook exercise sets.",
        "Focus on profit-loss, ratio-proportion and time-work — the most common question types.",
    ],
    "verbal_ability": [
        "Read one English article or editorial daily and note down any unfamiliar words.",
        "Build your vocabulary with 5 new words a day using flashcards or a vocab app.",
        "Practise fill-in-the-blank and sentence-correction exercises from previous exam papers.",
    ],
    "spatial_reasoning": [
        "Sketch mirror images and rotated shapes with pen and paper to build visual thinking.",
        "Solve Rubik's cube or tangram puzzles — they sharpen mental rotation skills.",
        "Work through past spatial reasoning papers and re-draw each figure by hand.",
    ],
}

SECTION_TIPS_HI: dict[str, list[str]] = {
    "logical_reasoning": [
        "संख्या श्रृंखला, सादृश्यता (analogies) और न्यायवाक्य (syllogisms) जैसे पहेली प्रश्नों का रोज़ाना 15 मिनट अभ्यास करें।",
        "पैटर्न पहचानने की क्षमता को तेज करने के लिए रोज़ सुबह एक नई पहेली हल करें।",
        "NTSE, KVPY या ओलंपियाड जैसी परीक्षाओं के पुराने प्रश्नपत्रों को हल करें।",
    ],
    "numerical_ability": [
        "दैनिक मानसिक गणित का अभ्यास करें: 25 तक पहाड़े, प्रतिशत के शॉर्टकट और भिन्न रूपांतरण।",
        "स्पीड मैथ्स ऐप्स या पाठ्यपुस्तक के अभ्यास प्रश्नों पर रोज़ाना 10 मिनट लगाएं।",
        "लाभ-हानि, अनुपात-समानुपात और समय-कार्य पर ध्यान केंद्रित करें — ये सबसे सामान्य प्रश्न प्रकार हैं।",
    ],
    "verbal_ability": [
        "प्रतिदिन एक संपादकीय या लेख पढ़ें और नए या अपरिचित शब्दों को नोट करें।",
        "फ़्लैशकार्ड या शब्दावली ऐप का उपयोग करके प्रतिदिन 5 नए शब्द सीखें।",
        "पुरानी परीक्षाओं के रिक्त स्थान भरने और वाक्य सुधारने वाले प्रश्नों का अभ्यास करें।",
    ],
    "spatial_reasoning": [
        "विजुअल सोच विकसित करने के लिए पेन और पेपर से दर्पण छवियों और घुमाए गए आकारों को स्केच करें।",
        "रूबिक क्यूब या तंग्राम पहेलियाँ हल करें — ये मानसिक रोटेशन कौशल को तेज करती हैं।",
        "पुराने स्थानिक तर्क प्रश्नपत्रों के चित्रों को हाथ से दोबारा बनाएं।",
    ],
}

DEFAULT_STEP_ACTIONS: dict[str, dict[str, list[str]]] = {
    "Class 10": {
        "en": [
            "Focus on mastering Class 10 NCERT Mathematics and Science concepts thoroughly.",
            "Solve 5–10 challenging multi-step math problems daily to build problem-solving stamina.",
            "Practice previous years' board exam question papers to secure 80%+ marks.",
        ],
        "hi": [
            "कक्षा 10वीं NCERT गणित और विज्ञान की अवधारणाओं को गहराई से समझें।",
            "समस्या-समाधान की गति बढ़ाने के लिए रोज़ाना 5–10 गणितीय प्रश्न हल करें।",
            "बोर्ड परीक्षा में 80%+ अंक प्राप्त करने के लिए पिछले वर्षों के प्रश्नपत्र हल करें।",
        ],
    },
    "Stream": {
        "en": [
            "Select the stream combination that aligns with your targeted entrance exams.",
            "Choose relevant electives (such as Computer Science, Economics, or Psychology).",
            "Engage in foundational introductory reading before the Class 11 academic session begins.",
        ],
        "hi": [
            "अपने लक्षित प्रवेश परीक्षाओं के अनुकूल स्ट्रीम संयोजन का चयन करें।",
            "उचित ऐच्छिक विषय (जैसे कंप्यूटर साइंस, अर्थशास्त्र, या मनोविज्ञान) चुनें।",
            "कक्षा 11वीं का सत्र शुरू होने से पहले मूलभूत विषयों का अग्रिम अध्ययन करें।",
        ],
    },
    "Class 11–12": {
        "en": [
            "Align your daily study schedule between board curriculum and entrance exam syllabi.",
            "Build deep conceptual clarity across core subjects and create concise formula sheets.",
            "Join a structured mock test series to build speed and accuracy under exam timing.",
        ],
        "hi": [
            "बोर्ड पाठ्यक्रम और प्रवेश परीक्षा की तैयारी के बीच संतुलित दैनिक समय सारणी बनाएं।",
            "मूल विषयों में स्पष्ट अवधारणा विकसित करें और संक्षिप्त फॉर्मूला नोट्स तैयार करें।",
            "परीक्षा के समय-प्रबंधन और सटीकता के लिए नियमित मॉक टेस्ट सीरीज़ में भाग लें।",
        ],
    },
    "Entrance Exam": {
        "en": [
            "Register for primary national and state-level entrance tests in your target stream.",
            "Solve the past 5–10 years of entrance question papers under timed conditions.",
            "Review test analytics to eliminate negative marking and identify high-yield topics.",
        ],
        "hi": [
            "अपने लक्षित क्षेत्र की राष्ट्रीय और राज्य स्तरीय प्रवेश परीक्षाओं के लिए समय पर पंजीकरण करें।",
            "समयबद्ध परिस्थितियों में पिछले 5–10 वर्षों के प्रवेश प्रश्नपत्रों को हल करें।",
            "नेगेटिव मार्किंग से बचने और उच्च-अंक वाले अध्यायों की पहचान के लिए मॉक टेस्ट का विश्लेषण करें।",
        ],
    },
    "Degree": {
        "en": [
            "Participate actively in centralized seat allocation and counselling rounds.",
            "Maintain strong academic consistency in foundational subjects during the first two years.",
            "Pursue real-world internships and industry projects during your penultimate year.",
        ],
        "hi": [
            "विश्वविद्यालय और कॉलेज की केंद्रीकृत काउंसलिंग प्रक्रिया में सक्रिय रूप से भाग लें।",
            "पहले दो वर्षों के दौरान अपने डिग्री विषयों में निरंतर उत्कृष्ट प्रदर्शन बनाए रखें।",
            "अंतिम वर्ष से पहले व्यावहारिक इंटर्नशिप और लाइव प्रोजेक्ट्स पूरे करें।",
        ],
    },
    "First Job": {
        "en": [
            "Participate in campus placement drives and industry technical hiring assessments.",
            "Build a verified portfolio of completed projects demonstrating applied competency.",
            "Learn professional collaboration, industry tools, and workplace communication.",
        ],
        "hi": [
            "कैंपस प्लेसमेंट ड्राइव और तकनीकी भर्ती परीक्षाओं में आत्मविश्वास के साथ भाग लें।",
            "अपनी व्यावहारिक क्षमता प्रदर्शित करने वाले प्रोजेक्ट्स का एक सशक्त पोर्टफोलियो बनाएं।",
            "व्यावसायिक सहयोग, उद्योग-मानक टूल्स और कार्यस्थल संवाद कौशल सीखें।",
        ],
    },
    "Growth": {
        "en": [
            "Take end-to-end ownership of complex projects and specialized technical areas.",
            "Pursue advanced certifications or continuous professional development.",
            "Step into leadership, mentoring, or strategic decision-making roles.",
        ],
        "hi": [
            "जटिल प्रोजेक्ट्स और विशेष कार्यक्षेत्रों का पूर्ण स्वामित्व लें।",
            "उन्नत प्रमाणपत्र (Certifications) प्राप्त करें और पेशेवर विकास जारी रखें।",
            "टीम नेतृत्व, मेंटरशिप और रणनीतिक निर्णय लेने वाली भूमिकाओं में आगे बढ़ें।",
        ],
    },
}


def _get_student_class_num(profile: StudentProfile | None) -> int:
    """Extract student class as an integer between 8 and 12, default 10."""
    if not profile or not profile.student_class:
        return 10
    try:
        val = int(profile.student_class)
        return max(8, min(12, val))
    except (ValueError, TypeError):
        return 10


def _get_exam_start_class(exam_name: str) -> str:
    """Determine the recommended class to begin entrance exam preparation."""
    upper = exam_name.upper()
    if any(k in upper for k in ["JEE", "NEET", "NDA", "NATA", "UCEED", "NIFT"]):
        return "Class 11"
    return "Class 12"


def generate_stream_advice(career: dict[str, Any], student_class: int, language: Language = "en") -> str | None:
    """Generate stream advice for Class 8-10 students; returns None for Class 11-12."""
    if student_class > 10:
        return None

    title = career.get("title", "this career")
    stream_step = next((s for s in career.get("roadmap", []) if s.get("stage") == "Stream"), None)
    stream_title = stream_step.get("title", "") if stream_step else ""

    if "PCM" in stream_title or "Physics, Chemistry and Maths" in stream_step.get("desc", ""):
        if language == "hi":
            return (
                f"{title} में आगे बढ़ने के लिए कक्षा 11वीं में भौतिकी, रसायन और गणित (PCM) स्ट्रीम चुनें। "
                "कक्षा 10वीं बोर्ड में गणित और विज्ञान में 75%+ अंक बनाए रखने का लक्ष्य रखें ताकि यह विकल्प खुला रहे।"
            )
        return (
            f"To pursue {title}, choose Science with Physics, Chemistry, and Mathematics (PCM) in Class 11. "
            "Maintain 75%+ across Mathematics and Science in Class 10 boards to comfortably keep this pathway open."
        )
    elif "PCB" in stream_title or "Biology" in stream_step.get("desc", ""):
        if language == "hi":
            return (
                f"{title} के लिए कक्षा 11वीं में भौतिकी, रसायन और जीवविज्ञान (PCB) चुनना अनिवार्य है। "
                "कक्षा 10वीं में विज्ञान में कम से कम 75%+ अंक प्राप्त करने पर ध्यान दें।"
            )
        return (
            f"For {title}, you need Science with Physics, Chemistry, and Biology (PCB) in Class 11. "
            "Focus on securing at least 75%+ in Science in Class 10 to qualify for PCB admissions."
        )
    elif "Commerce" in stream_title:
        if language == "hi":
            return (
                f"{title} के लिए कक्षा 11वीं में कॉमर्स (विशेष रूप से गणित के साथ) का चयन सबसे उपयुक्त है। "
                "कक्षा 10वीं में गणित और अंग्रेजी में अच्छी पकड़ बनाए रखें।"
            )
        return (
            f"For {title}, choose Commerce (preferably with Mathematics) in Class 11. "
            "Build strong fundamentals in Class 10 Mathematics and English."
        )
    else:
        if language == "hi":
            return (
                f"{title} के लिए कक्षा 11वीं में अपनी रुचि और एप्टीट्यूड के अनुसार स्ट्रीम चुनें। "
                "बोर्ड परीक्षा में न्यूनतम 70%+ का लक्ष्य रखें ताकि सभी उच्च शिक्षा विकल्प खुले रहें।"
            )
        return (
            f"For {title}, evaluate subjects in Class 11 that develop critical thinking and communication. "
            "Aim for 70%+ in Class 10 boards to ensure flexibility across subject streams."
        )


def check_marks_gate(
    stream_step: dict[str, Any],
    subject_marks: SubjectMarks | None,
    career: dict[str, Any],
    careers_by_id: dict[str, dict[str, Any]],
    language: Language = "en",
) -> str | None:
    """Check whether student's marks meet the threshold for PCM, PCB, or Commerce streams."""
    if not subject_marks:
        return None

    stream_text = f"{stream_step.get('title', '')} {stream_step.get('desc', '')}"
    maths = subject_marks.maths
    science = subject_marks.science
    english = subject_marks.english

    related_ids = career.get("relatedCareers", [])
    related_title = "an alternative pathway"
    if related_ids and related_ids[0] in careers_by_id:
        related_title = careers_by_id[related_ids[0]].get("title", related_ids[0])

    if "PCM" in stream_text:
        # Check maths and science
        m_val = maths if maths is not None else 100
        s_val = science if science is not None else 100
        if m_val < 60:
            if language == "hi":
                return f"चेतावनी: गणित में आपका स्कोर {m_val} है; कक्षा 11वीं में PCM के लिए इसे 75 या उससे अधिक करने का प्रयास करें, या {related_title} जैसे विकल्पों पर विचार करें।"
            return f"Watch-out: Your Maths mark is currently {m_val}/100; work to raise Maths to 75 or above before Class 11 to keep PCM admission smooth. Alternatively, consider {related_title}."
        if s_val < 60:
            if language == "hi":
                return f"चेतावनी: विज्ञान में आपका स्कोर {s_val} है; कक्षा 11वीं में PCM के लिए इसे 75 या उससे अधिक करें, या {related_title} पर विचार करें।"
            return f"Watch-out: Your Science mark is currently {s_val}/100; work to raise Science to 75 or above before Class 11. Alternatively, consider {related_title}."
    elif "PCB" in stream_text:
        s_val = science if science is not None else 100
        if s_val < 60:
            if language == "hi":
                return f"चेतावनी: विज्ञान में आपका स्कोर {s_val} है; कक्षा 11वीं में PCB के लिए इसे 75 या उससे अधिक करें, या {related_title} पर विचार करें।"
            return f"Watch-out: Your Science mark is currently {s_val}/100; work to raise Science to 75 or above before Class 11. Alternatively, consider {related_title}."
    elif "Commerce" in stream_text:
        m_val = maths if maths is not None else 100
        e_val = english if english is not None else 100
        if m_val < 60 or e_val < 60:
            low_subject = "Maths" if m_val < 60 else "English"
            low_score = m_val if m_val < 60 else e_val
            if language == "hi":
                return f"चेतावनी: {low_subject} में आपका स्कोर {low_score} है; कक्षा 11वीं में कॉमर्स के लिए इसे 75 या उससे अधिक करें, या {related_title} पर विचार करें।"
            return f"Watch-out: Your {low_subject} mark is currently {low_score}/100; work to raise {low_subject} to 75 or above before Class 11. Alternatively, consider {related_title}."

    return None


def personalize_roadmap(
    career_id: str,
    result: AssessResult | None = None,
    profile: StudentProfile | None = None,
    language: Language = "en",
    polish: bool = False,
) -> RoadmapResponse:
    """Build a personalised, grade-aligned career roadmap."""
    careers = get_careers()
    careers_by_id = {c["id"]: c for c in careers}

    career = careers_by_id.get(career_id)
    if not career:
        raise ValueError(f"Unknown career ID: {career_id}")

    student_class = _get_student_class_num(profile)
    base_roadmap = career.get("roadmap", [])
    req_aptitudes = career.get("requiredAptitudes", [])
    section_scores = result.sectionScores if result else {}

    # 1. Map existing steps and place student by grade
    custom_steps: list[dict[str, Any]] = []

    for item in base_roadmap:
        step_num = item.get("step", len(custom_steps) + 1)
        stage = item.get("stage", "")
        title = item.get("title", "")
        desc = item.get("desc", "")

        status = "later"
        timing = ""

        if stage == "Class 10":
            if student_class >= 11:
                status = "done"
                timing = "Completed" if language == "en" else "पूर्ण"
            else:
                status = "now"
                timing = (
                    f"Current Academic Year (Class {student_class})"
                    if language == "en"
                    else f"वर्तमान शैक्षणिक वर्ष (कक्षा {student_class}वीं)"
                )
        elif stage == "Stream":
            if student_class >= 11:
                status = "done"
                timing = "Completed" if language == "en" else "पूर्ण"
            elif student_class == 10:
                status = "next"
                timing = (
                    "End of Class 10 / Class 11 Admission"
                    if language == "en"
                    else "कक्षा 10वीं के अंत में / कक्षा 11वीं में प्रवेश"
                )
            else:
                status = "later"
                timing = "End of Class 10" if language == "en" else "कक्षा 10वीं के बाद"
        elif stage == "Class 11–12" or "11" in stage:
            if student_class == 12:
                status = "now"
                timing = (
                    "Ongoing (Class 12 Final Phase)"
                    if language == "en"
                    else "जारी (कक्षा 12वीं अंतिम चरण)"
                )
            elif student_class == 11:
                status = "now"
                timing = (
                    "Current Academic Year (Class 11)"
                    if language == "en"
                    else "वर्तमान शैक्षणिक वर्ष (कक्षा 11वीं)"
                )
            else:
                status = "later"
                timing = "Class 11 & 12" if language == "en" else "कक्षा 11वीं और 12वीं"
        elif stage == "Entrance Exam" or "Exam" in stage:
            if student_class == 12:
                status = "next"
                timing = (
                    "Class 12 (Upcoming Exam Season)"
                    if language == "en"
                    else "कक्षा 12वीं (आगामी परीक्षा सत्र)"
                )
            else:
                status = "later"
                timing = "Class 12 Board Year" if language == "en" else "कक्षा 12वीं बोर्ड वर्ष"
        elif stage == "Degree":
            status = "later"
            timing = "Undergraduate Years" if language == "en" else "स्नातक अध्ययन वर्ष"
        elif stage == "First Job":
            status = "later"
            timing = "Post-Graduation" if language == "en" else "स्नातक के बाद"
        elif stage == "Growth":
            status = "later"
            timing = "Career Years 3–5+" if language == "en" else "करियर के 3-5+ वर्ष"

        # Action items from dictionary
        actions = list(DEFAULT_STEP_ACTIONS.get(stage, {}).get(language, []))
        if not actions:
            actions = [
                f"Complete key milestones for {stage}." if language == "en" else f"{stage} के प्रमुख कार्य पूरे करें।",
                "Review progress regularly with your teachers or mentor." if language == "en" else "शिक्षकों या मेंटर के साथ अपनी प्रगति की समीक्षा करें।",
            ]

        # Marks gate check on Stream step
        if stage == "Stream" and profile and profile.subjectMarks:
            gate_watchout = check_marks_gate(item, profile.subjectMarks, career, careers_by_id, language)
            if gate_watchout:
                desc = f"{desc} | {gate_watchout}"
                actions.insert(0, gate_watchout)

        custom_steps.append({
            "step": step_num,
            "stage": stage,
            "title": title,
            "desc": desc,
            "status": status,
            "timing": timing,
            "actions": actions[:3],
        })

    # 2. Weak required aptitude insertion (< 50)
    weak_required = [sec for sec in req_aptitudes if section_scores.get(sec, 100) < 50]
    if weak_required:
        # Find index of entrance exam step
        exam_idx = next(
            (i for i, s in enumerate(custom_steps) if s["stage"] == "Entrance Exam" or "Exam" in s["stage"]),
            len(custom_steps) // 2,
        )

        for sec in weak_required:
            sec_score = section_scores.get(sec, 0)
            sec_name_en = SECTION_NAMES.get(sec, {}).get("en", sec.replace("_", " ").title())
            sec_name_hi = SECTION_NAMES.get(sec, {}).get("hi", sec_name_en)

            title_step = (
                f"Strengthen {sec_name_en}"
                if language == "en"
                else f"{sec_name_hi} को मजबूत करें"
            )
            desc_step = (
                f"Your {sec_name_en} score is currently {sec_score}% (below 50%). Building strong analytical habits now will directly improve your performance in entrance tests and career problem-solving."
                if language == "en"
                else f"{sec_name_hi} में आपका स्कोर {sec_score}% (50% से कम) है। अभी से नियमित अभ्यास करने से प्रवेश परीक्षाओं और करियर में आपकी सफलता सुनिश्चित होगी।"
            )
            bridge_status = "now" if student_class >= 11 else "next"
            bridge_timing = "Immediate Action Item" if language == "en" else "तत्काल प्राथमिकता"
            tips_list = SECTION_TIPS_HI.get(sec, []) if language == "hi" else SECTION_TIPS.get(sec, [])

            bridge_step = {
                "step": 0,  # renumbered below
                "stage": "Aptitude Bridge" if language == "en" else "एप्टीट्यूड सुधार",
                "title": title_step,
                "desc": desc_step,
                "status": bridge_status,
                "timing": bridge_timing,
                "actions": tips_list[:3],
            }
            custom_steps.insert(exam_idx, bridge_step)
            exam_idx += 1

    # Renumber steps sequentially
    final_steps: list[RoadmapStep] = []
    for idx, s in enumerate(custom_steps, start=1):
        final_steps.append(RoadmapStep(
            step=idx,
            stage=s["stage"],
            title=s["title"],
            desc=s["desc"],
            status=s["status"],
            timing=s["timing"],
            actions=s["actions"],
        ))

    # 3. streamAdvice for Class 8-10 students
    stream_advice = generate_stream_advice(career, student_class, language)

    # 4. examPlan[] from career.entranceExams
    exam_plan: list[dict[str, Any]] = []
    for exam in career.get("entranceExams", []):
        if isinstance(exam, dict):
            e_name = exam.get("name", "")
            e_desc = exam.get("desc", "")
        else:
            e_name = str(exam)
            e_desc = ""

        exam_plan.append({
            "name": e_name,
            "desc": e_desc,
            "startPreparingBy": _get_exam_start_class(e_name),
        })

    # 5. focusAreas[]
    focus_areas: list[str] = []
    if req_aptitudes:
        sec1_lbl = SECTION_NAMES.get(req_aptitudes[0], {}).get(language, req_aptitudes[0])
        focus_areas.append(f"{sec1_lbl} Problem Solving" if language == "en" else f"{sec1_lbl} अभ्यास")
    if len(req_aptitudes) > 1:
        sec2_lbl = SECTION_NAMES.get(req_aptitudes[1], {}).get(language, req_aptitudes[1])
        focus_areas.append(f"{sec2_lbl} Foundations" if language == "en" else f"{sec2_lbl} मूलभूत समझ")
    if career.get("skills"):
        top_skill = career["skills"][0]
        focus_areas.append(f"{top_skill} Mastery" if language == "en" else f"{top_skill} में निपुणता")
    focus_areas = focus_areas[:3]

    # 6. backupPaths[] from career.relatedCareers
    backup_paths: list[dict[str, Any]] = []
    # If student assessment provided, calculate matches
    rec_matches: dict[str, int] = {}
    if result:
        rec_res = recommend_careers(result, profile, language)
        rec_matches = {c["id"]: c["matchPct"] for c in rec_res.get("careers", [])}

    for rel_id in career.get("relatedCareers", []):
        rel_career = careers_by_id.get(rel_id)
        if not rel_career:
            continue
        rel_title = rel_career.get("title", rel_id)
        rel_match = rec_matches.get(rel_id)

        why_text = (
            f"Shares foundational cognitive skills with {career.get('title')}."
            if language == "en"
            else f"{career.get('title')} के साथ कई मुख्य एप्टीट्यूड और कौशलों को साझा करता है।"
        )
        backup_paths.append({
            "id": rel_id,
            "title": rel_title,
            "matchPct": rel_match,
            "whyItWorks": why_text,
        })

    # Optional Polish with Grounding Check
    from app.config import settings

    if polish and settings.llm_configured:
        try:
            grounding_names = {career.get("title", "").lower()}
            for e in career.get("entranceExams", []):
                e_name = e.get("name", "") if isinstance(e, dict) else str(e)
                grounding_names.add(e_name.lower())
            for c_name in career.get("topColleges", []):
                grounding_names.add(c_name.lower())
            for r_id in career.get("relatedCareers", []):
                if r_id in careers_by_id:
                    grounding_names.add(careers_by_id[r_id]["title"].lower())

            system_prompt = (
                "You are an inspiring mentor speaking to a 14-year-old student. "
                "Polish the roadmap step descriptions to be clear and motivating. "
                "STRICT GROUNDING RULE: Never invent any new exam, college, or degree names. "
                "Keep the exact same number of steps and stages."
            )
            prompt = (
                f"Career: {career.get('title')}\n"
                f"Steps: {json.dumps([s.model_dump() for s in final_steps])}\n"
                "Please return the polished steps as a JSON array of objects with step, stage, title, desc, status, timing, actions."
            )
            raw = generate_completion(prompt=prompt, system_prompt=system_prompt)
            if raw:
                clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.DOTALL)
                parsed = json.loads(clean_json)
                if isinstance(parsed, list) and len(parsed) == len(final_steps):
                    # Grounding check on entity names
                    passed = True
                    for p_step in parsed:
                        desc_text = p_step.get("desc", "")
                        # Verify no ungrounded exam names appeared
                        for word in ["iit", "nit", "jee", "neet", "clat", "cat", "upsc"]:
                            if word in desc_text.lower() and not any(word in g for g in grounding_names):
                                passed = False
                                break
                    if passed:
                        polished_steps = [RoadmapStep(**p) for p in parsed]
                        return RoadmapResponse(
                            careerId=career_id,
                            steps=polished_steps,
                            focusAreas=focus_areas,
                            streamAdvice=stream_advice,
                            examPlan=exam_plan,
                            backupPaths=backup_paths,
                            source="llm",
                        )
        except Exception:
            pass  # Fall back to rules

    return RoadmapResponse(
        careerId=career_id,
        steps=final_steps,
        focusAreas=focus_areas,
        streamAdvice=stream_advice,
        examPlan=exam_plan,
        backupPaths=backup_paths,
        source="rules",
    )

