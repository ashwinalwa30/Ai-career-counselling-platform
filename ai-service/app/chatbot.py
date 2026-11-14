"""AI Counsellor Chatbot Engine (POST /ai/chat).

Empathetic, age-appropriate (Class 8-12) conversational guidance grounded in careers.json.
Provides 100% offline rule-based intent classification and conversational responses,
with optional LLM enrichment when configured.
"""

from __future__ import annotations

import re
from typing import Any

from app.analysis import SECTION_NAMES
from app.data_loader import get_careers
from app.llm_client import generate_completion
from app.schemas import ChatResponse, ChatTurn, Language

CAREER_KEYWORDS: dict[str, list[str]] = {
    "software_engineer": ["software", "programmer", "coding", "developer", "sde", "computer engineer"],
    "data_scientist": ["data science", "data scientist", "ai", "machine learning", "analytics"],
    "game_developer": ["game", "game developer", "gaming", "unreal", "unity"],
    "doctor": ["doctor", "mbbs", "medicine", "medical", "physician", "neet"],
    "physiotherapist": ["physiotherapy", "physiotherapist", "bpt", "rehab"],
    "psychologist": ["psychology", "psychologist", "mental health", "counsellor"],
    "chartered_accountant": ["ca", "chartered accountant", "icai", "audit", "taxation"],
    "entrepreneur": ["entrepreneur", "startup", "business", "founder", "venture"],
    "lawyer": ["lawyer", "advocate", "law", "clat", "llb", "legal"],
    "civil_services_ias": ["ias", "upsc", "civil services", "ips", "ifs", "collector"],
    "defence_officer": ["defence", "nda", "army", "navy", "air force", "military"],
    "architect": ["architect", "architecture", "nata", "building design"],
    "graphic_designer": ["graphic design", "graphic designer", "ui/ux", "uceed", "visual design"],
    "fashion_designer": ["fashion", "fashion designer", "nift", "apparel"],
    "teacher": ["teacher", "teaching", "professor", "educator", "ctet", "b.ed"],
    "journalist": ["journalist", "journalism", "media", "reporter", "news"],
    "commercial_pilot": ["pilot", "commercial pilot", "aviation", "flying", "aircraft"],
    "hotel_management": ["hotel management", "hospitality", "ihm", "nchm"],
    "agricultural_scientist": ["agriculture", "agricultural scientist", "farming", "icar", "agronomy"],
    "electrician_iti": ["electrician", "iti", "wireman", "skilled trade"],
}


def format_salary_range(bracket: dict[str, int] | Any) -> str:
    """Format an INR salary bracket like {'min': 400000, 'max': 800000} into '₹4L–8L'."""
    if isinstance(bracket, dict):
        min_l = bracket.get("min", 0) / 100000.0
        max_l = bracket.get("max", 0) / 100000.0
        min_str = f"{int(min_l)}" if min_l.is_integer() else f"{min_l:.1f}"
        max_str = f"{int(max_l)}" if max_l.is_integer() else f"{max_l:.1f}"
        return f"₹{min_str}L–{max_str}L"
    return str(bracket)


def _match_career_intent(msg: str) -> str | None:
    """Identify if the user is asking about a specific career from careers.json using word boundaries."""
    lowered = msg.lower()
    for career_id, keywords in CAREER_KEYWORDS.items():
        for kw in keywords:
            pattern = rf"\b{re.escape(kw)}\b"
            if re.search(pattern, lowered):
                return career_id
    return None


def generate_rule_based_chat_reply(
    message: str,
    context: dict[str, Any] | None = None,
    language: Language = "en",
) -> str:
    """Generate a rich, encouraging, grounded reply using deterministic intent rules."""
    q = message.lower().strip()
    careers = get_careers()
    careers_by_id = {c["id"]: c for c in careers}

    # Extract contextual signals
    ctx = context or {}
    test_result = ctx.get("testResult") or ctx.get("result") or {}
    overall_score = test_result.get("overallScore")
    top_careers = ctx.get("topCareers") or []

    # 1. Specific Career Inquiries (checked before generic intents)
    matched_career_id = _match_career_intent(q)
    if matched_career_id and matched_career_id in careers_by_id:
        career = careers_by_id[matched_career_id]
        title = career.get("title", matched_career_id)
        raw_exams = career.get("entranceExams", [])
        exams = ", ".join(
            e["name"] if isinstance(e, dict) else str(e) for e in raw_exams
        )
        colleges = career.get("topColleges", [])
        colleges_str = ", ".join(colleges[:3]) if colleges else "top institutions"
        salary = career.get("salary", {})
        entry_bracket = salary.get("entry", {})
        senior_bracket = salary.get("senior", {})
        entry_str = format_salary_range(entry_bracket)
        senior_str = format_salary_range(senior_bracket)
        skills = ", ".join(career.get("skills", [])[:4])
        outlook = career.get("futureOutlook", "")

        if language == "hi":
            return (
                f"**{title}** एक शानदार करियर विकल्प है! यहाँ आपके लिए महत्वपूर्ण जानकारी है:\n\n"
                f"- **प्रवेश परीक्षाएं:** {exams}\n"
                f"- **प्रमुख कॉलेज:** {colleges_str}\n"
                f"- **शुरुआती वेतन:** {entry_str} | **वरिष्ठ स्तर:** {senior_str}\n"
                f"- **जरूरी कौशल:** {skills}\n\n"
                f"{outlook[:200] if outlook else ''}\n\n"
                "क्या आप इस करियर की व्यक्तिगत रोडमैप देखना चाहते हैं?"
            )
        return (
            f"**{title}** is a great career to explore! Here are the key facts:\n\n"
            f"- **Entrance Exams:** {exams}\n"
            f"- **Top Colleges:** {colleges_str}\n"
            f"- **Starting Salary:** {entry_str} | **Senior Level:** {senior_str}\n"
            f"- **Key Skills:** {skills}\n\n"
            f"{outlook[:200] if outlook else ''}\n\n"
            "Would you like a personalised roadmap for this career?"
        )

    # 2. Stream Selection Intent
    if any(k in q for k in ["stream", "pcm", "pcb", "commerce", "arts", "humanities", "science"]):
        if top_careers:
            top_str = ", ".join(top_careers[:3])
            if language == "hi":
                return (
                    f"आपके एप्टीट्यूड टेस्ट के आधार पर, आपका प्रोफाइल **{top_str}** जैसे क्षेत्रों से बहुत अच्छा मेल खाता है। "
                    "इनके लिए आमतौर पर संबंधित स्ट्रीम (जैसे विज्ञान या कॉमर्स) की आवश्यकता होती है। "
                    "कक्षा 10वीं के बाद स्ट्रीम चुनते समय अपनी स्वाभाविक रुचियों और मुख्य विषयों में अपने स्कोर को ध्यान में रखें।"
                )
            return (
                f"Based on your assessment results, your profile aligns prominently with careers like **{top_str}**. "
                "These paths generally lead through Science (PCM/PCB) or Commerce streams depending on the specialization. "
                "When choosing your Class 11 stream, prioritize subjects where you genuinely enjoy solving problems and scoring consistently."
            )
        else:
            if language == "hi":
                return (
                    "कक्षा 11वीं में स्ट्रीम चुनना आपके भविष्य की दिशा तय करने में एक महत्वपूर्ण कदम है:\n\n"
                    "1. **विज्ञान (PCM):** इंजीनियरिंग, कंप्यूटर साइंस, आर्किटेक्चर और रक्षा सेवाओं के लिए।\n"
                    "2. **विज्ञान (PCB):** मेडिकल (MBBS), फिजियोथेरेपी और कृषि विज्ञान के लिए।\n"
                    "3. **कॉमर्स:** चार्टर्ड अकाउंटेंसी (CA), वित्त, बैंकिंग और व्यावसायिक प्रबंधन के लिए।\n"
                    "4. **कला/मानविकी:** कानून (Law), पत्रकारिता, डिजाइन, सिविल सेवा और मनोविज्ञान के लिए।\n\n"
                    "सटीक सुझाव के लिए पहले एप्टीट्यूड टेस्ट पूरा करें ताकि आपकी मजबूत क्षमताओं का पता चल सके।"
                )
            return (
                "Choosing your Class 11 stream is a key milestone for secondary students:\n\n"
                "1. **Science (PCM):** Best for engineering, technology, computer science, and architecture.\n"
                "2. **Science (PCB):** Required for medicine (MBBS), biotechnology, physiotherapy, and healthcare.\n"
                "3. **Commerce:** Ideal for chartered accountancy, financial analysis, corporate law, and business.\n"
                "4. **Arts / Humanities:** Excellent for law, civil services (UPSC), media, design, and psychology.\n\n"
                "I recommend taking the PathFinder aptitude test first to see exactly how your cognitive profile maps to these streams!"
            )

    # 3. Class 10 Choices
    if any(k in q for k in ["class 10", "after 10", "10th", "boards"]):
        if language == "hi":
            return (
                "कक्षा 10वीं के बाद आपके पास कई मुख्य रास्ते होते हैं:\n\n"
                "- **कक्षा 11-12 (CBSE/ICSE/स्टेट बोर्ड):** उच्च शिक्षा और डिग्री के लिए सबसे सामान्य और सुरक्षित विकल्प।\n"
                "- **पॉलिटेक्निक डिप्लोमा:** व्यावहारिक इंजीनियरिंग कौशल सीखने के लिए 3 वर्षीय पाठ्यक्रम।\n"
                "- **ITI ट्रेड्स:** विशिष्ट तकनीकी कौशलों के लिए व्यावहारिक प्रशिक्षण।\n\n"
                "बोर्ड परीक्षा में गणित, विज्ञान और भाषा में 75%+ अंक प्राप्त करने से आपके लिए सभी विकल्प खुले रहते हैं।"
            )
        return (
            "After Class 10, Indian students primarily choose between:\n\n"
            "- **Class 11–12 (Higher Secondary):** The standard route preparing for university degrees via Science, Commerce, or Arts.\n"
            "- **Polytechnic Diploma:** 3-year technical diplomas offering direct industry entry or lateral entry to B.Tech 2nd year.\n"
            "- **ITI Technical Courses:** Vocational trades for specialized hands-on technical professions.\n\n"
            "Keeping your Class 10 board scores above 75% in core subjects ensures maximum flexibility across all school streams."
        )

    # 4. Entrance Exams
    if any(k in q for k in ["jee", "neet", "clat", "cuet", "nda", "upsc", "exam", "entrance"]):
        if language == "hi":
            return (
                "भारत की प्रमुख प्रवेश परीक्षाओं का संक्षिप्त विवरण:\n\n"
                "- **JEE Main & Advanced:** IIT, NIT और IIIT में इंजीनियरिंग (B.Tech) के लिए। कक्षा 11वीं से तैयारी शुरू करें।\n"
                "- **NEET-UG:** देश भर में MBBS और BDS प्रवेश के लिए एकमात्र राष्ट्रीय परीक्षा।\n"
                "- **CLAT:** प्रतिष्ठित नेशनल लॉ यूनिवर्सिटीज (NLUs) में 5-वर्षीय एकीकृत कानून (BA LLB) के लिए।\n"
                "- **CUET:** केंद्रीय और शीर्ष राज्य विश्वविद्यालयों में स्नातक पाठ्यक्रमों के लिए।\n"
                "- **NDA:** कक्षा 12वीं के बाद भारतीय थलसेना, नौसेना या वायुसेना में अधिकारी बनने के लिए।\n\n"
                "आप किस परीक्षा के बारे में विशेष जानकारी चाहते हैं?"
            )
        return (
            "Here is an overview of key national entrance exams in India:\n\n"
            "- **Engineering (JEE Main / Advanced):** Gateway to NITs, IIITs, and IITs. Start rigorous conceptual prep in Class 11.\n"
            "- **Medicine (NEET-UG):** The single national entrance test for MBBS/BDS admissions across all medical colleges.\n"
            "- **Law (CLAT):** Entrance test for 5-year integrated law programs at National Law Universities.\n"
            "- **Undergraduate Programs (CUET):** Single-window test for prestigious central universities (Delhi University, BHU, etc.).\n"
            "- **Defence (NDA):** Direct entry after Class 12 to become a commissioned officer in the Armed Forces.\n\n"
            "Which entrance examination are you currently planning for?"
        )

    # 5. Salary & Compensation Outlook
    if any(k in q for k in ["salary", "earn", "pay", "package", "money", "lpa", "income"]):
        if top_careers:
            top_c_names = ", ".join(top_careers[:3])
            if language == "hi":
                return (
                    f"आपके शीर्ष अनुशंसित करियर (**{top_c_names}**) में वेतन वृद्धि की अच्छी संभावनाएं हैं। "
                    "प्रारंभिक वेतन कॉलेज, शहर और व्यावहारिक कौशल पर निर्भर करता है, लेकिन अनुभव के साथ इसमें 3 से 5 गुना वृद्धि देखी जाती है। "
                    "क्या आप किसी विशिष्ट करियर के वेतन आंकड़ों के बारे में जानना चाहते हैं?"
                )
            return (
                f"Your top matching careers (**{top_c_names}**) carry solid long-term earning potential. "
                "In India, compensation scales strongly with skill mastery, college tier, and practical projects. "
                "Entry packages range from ₹4–15 Lakhs per annum and expand significantly after 3–5 years of proven experience."
            )
        else:
            if language == "hi":
                return (
                    "वेतन विभिन्न करियर क्षेत्रों में भिन्न होता है:\n\n"
                    "- **टेक्नोलॉजी व AI:** ₹5–15 लाख (आरंभिक), ₹20–80 लाख+ (वरिष्ठ)\n"
                    "- **चिकित्सा (MBBS/MD):** ₹6–10 लाख (प्रारंभिक), ₹25–60 लाख+ (विशेषज्ञ)\n"
                    "- **फाइनेंस व CA:** ₹7–12 लाख (आरंभिक), ₹25–50 लाख+ (अनुभवी)\n"
                    "- **सिविल सेवा:** 7वें वेतन आयोग के अनुसार निर्धारित वेतन + भत्ते\n\n"
                    "वेतन महत्वपूर्ण है, लेकिन दीर्घकालिक सफलता आपके व्यक्तिगत एप्टीट्यूड और कार्य संतुष्टि पर निर्भर करती है।"
                )
            return (
                "Compensation benchmarks vary across disciplines in India:\n\n"
                "- **Technology & Data Science:** ₹5–15 LPA entry, scaling to ₹25–80+ LPA at senior levels.\n"
                "- **Medicine & Healthcare:** ₹6–10 LPA post-internship, expanding significantly with MD/MS specialization.\n"
                "- **Finance & Chartered Accountancy:** ₹7–12 LPA starting, with rapid growth in corporate advisory.\n"
                "- **Civil Services:** Structured salary as per the 7th Central Pay Commission plus housing and security allowances.\n\n"
                "While compensation is an important consideration, picking a path where you naturally excel ensures faster career progression!"
            )

    # 6. General Guidance / Fallback
    if overall_score is not None and top_careers:
        top_str = ", ".join(top_careers[:3])
        if language == "hi":
            return (
                f"यह एक बहुत अच्छा प्रश्न है! आपके एप्टीट्यूड स्कोर ({overall_score}%) के अनुसार, आपका प्रोफाइल विशेष रूप से **{top_str}** के अनुकूल है। "
                "मैं आपको स्ट्रीम चयन, प्रवेश परीक्षाओं (JEE, NEET, CLAT आदि), कॉलेज विकल्पों या बोर्ड परीक्षा की रणनीति में मदद कर सकता हूँ। "
                "आप किस विषय पर अधिक जानकारी चाहते हैं?"
            )
        return (
            f"That is a thoughtful question! Based on your aptitude test score of **{overall_score}%**, your profile shows high potential for **{top_str}**. "
            "I can help guide you through subject selection, national entrance exam strategies, top college pathways, or how to prepare during Class 9–12. "
            "What would you like to explore next?"
        )

    if language == "hi":
        return (
            "नमस्ते! मैं आपका PathFinder AI करियर काउंसलर हूँ। "
            "मैं आपको कक्षा 10वीं के बाद स्ट्रीम चुनने, प्रमुख प्रवेश परीक्षाओं (JEE, NEET, CLAT, CUET आदि), "
            "विभिन्न करियर के अवसरों और अपनी मजबूत क्षमताओं को पहचानने में मार्गदर्शन कर सकता हूँ। "
            "आप किस करियर या विषय के बारे में जानना चाहते हैं?"
        )
    return (
        "Hello! I am your PathFinder AI Career Counsellor. "
        "I can help you navigate stream selection after Class 10, entrance exam strategies (JEE, NEET, CLAT, CUET), "
        "college pathways, and career roadmaps suited for Class 8–12 students. "
        "What career, exam, or subject would you like to know more about?"
    )


def chat_counsellor(
    message: str,
    history: list[ChatTurn] | None = None,
    context: dict[str, Any] | None = None,
    language: Language = "en",
) -> ChatResponse:
    """Handle student conversation with deterministic fallback and optional LLM synthesis."""
    rule_reply = generate_rule_based_chat_reply(message, context, language)

    from app.config import settings

    if settings.llm_configured:
        try:
            careers = get_careers()
            ctx = context or {}
            top_careers = ctx.get("topCareers", [])

            system_prompt = (
                "You are an encouraging, empathetic, and knowledgeable career counsellor for Indian students aged 13–18 (Class 8–12). "
                "Provide thoughtful, supportive guidance grounded in Indian education realities (CBSE/ICSE/State boards, JEE, NEET, CUET, CLAT, INR packages). "
                "STRICT RULES:\n"
                "1. NEVER guarantee college admission, cutoffs, or fixed salary packages.\n"
                "2. When discussing careers, colleges, or exams, use established factual information.\n"
                "3. Keep your response encouraging, clear, and easy for a teenager to read (use short bullet points where appropriate).\n"
                f"4. Language: {'Hindi (Devanagari script)' if language == 'hi' else 'English'}."
            )

            # Build conversational prompt
            prompt_parts: list[str] = []
            if top_careers:
                prompt_parts.append(f"Student's top matching careers: {', '.join(top_careers)}")
            if history:
                prompt_parts.append("Recent conversation history:")
                for turn in history[-4:]:
                    prompt_parts.append(f"{turn.role.capitalize()}: {turn.content}")

            prompt_parts.append(f"Student: {message}")
            prompt = "\n".join(prompt_parts)

            llm_text = generate_completion(prompt=prompt, system_prompt=system_prompt, max_tokens=600)
            if llm_text and len(llm_text.strip()) > 30:
                return ChatResponse(
                    reply=llm_text.strip(),
                    source="llm",
                )
        except Exception:
            pass  # Fall back to deterministic rule-based reply

    return ChatResponse(
        reply=rule_reply,
        source="rules",
    )
