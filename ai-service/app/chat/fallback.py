"""Deterministic Fallback Engine for PathFinder AI Counsellor.

Ports and refines the keyword intent rules from frontend/src/services/api.js sendChatMessage.
Fixes keyword collision bugs (whole-word regex matching prevents 'ai' matching 'again' or 'explain')
and personalises with live topCareers from context. Enforces plain text with bold and line breaks only.
"""

from __future__ import annotations

import re
from typing import Any

from app.schemas import Language


def _match_whole_words(patterns: list[str], text: str) -> bool:
    """Check if any pattern matches as a whole word or boundary in the text."""
    lowered = text.lower()
    for p in patterns:
        if re.search(rf"\b{re.escape(p.lower())}\b", lowered):
            return True
    return False


def get_counsellor_fallback(
    message: str,
    context: dict[str, Any] | None = None,
    language: Language = "en",
) -> tuple[str, list[str], list[str]]:
    """Generate a deterministic fallback reply, suggested follow-ups, and cited career IDs.

    Returns:
        tuple of (reply_text, suggested_follow_ups, cited_career_ids)
    """
    q = message.lower().strip()
    ctx = context or {}
    test_result = ctx.get("testResult") or ctx.get("result") or {}
    score = test_result.get("overallScore")
    raw_top_careers = ctx.get("topCareers") or []

    # Normalize top careers to list of titles and list of IDs
    top_career_titles: list[str] = []
    top_career_ids: list[str] = []
    for tc in raw_top_careers:
        if isinstance(tc, str):
            top_career_titles.append(tc)
        elif isinstance(tc, dict):
            title = tc.get("title") or tc.get("id", "")
            if title:
                top_career_titles.append(title)
            cid = tc.get("id") or tc.get("careerId", "")
            if cid:
                top_career_ids.append(cid)

    has_results = bool(top_career_titles or score is not None)
    top_str = ", ".join(top_career_titles[:3])

    # 1. Stream Selection Intent (PCM, PCB, Commerce, Arts)
    if _match_whole_words(["stream", "pcm", "pcb", "arts", "commerce", "humanities", "science"], q):
        if has_results and top_str:
            if language == "hi":
                reply = (
                    f"आपके एप्टीट्यूड टेस्ट (स्कोर: **{score if score is not None else 75}%**) के आधार पर, "
                    f"आपका प्रोफाइल **{top_str}** जैसे क्षेत्रों से बहुत अच्छा मेल खाता है। "
                    "यह आमतौर पर विशिष्ट स्ट्रीम (जैसे PCM या कॉमर्स) की मांग करते हैं। "
                    "क्या आप इनमें से किसी करियर का विवरण देखना चाहते हैं?"
                )
            else:
                reply = (
                    f"Based on your aptitude test (overall score: **{score if score is not None else 75}%**), "
                    f"your profile aligns well with careers like **{top_str}**. "
                    "These usually require PCM, PCB, or Commerce streams depending on the exact path.\n\n"
                    "Would you like to explore one of these career roadmaps in detail?"
                )
            follow_ups = [
                "Which stream leads to software engineering?",
                "Can I switch streams after Class 11?",
                "What marks do I need for Commerce with Maths?",
            ] if language != "hi" else [
                "सॉफ्टवेयर इंजीनियरिंग के लिए कौन सी स्ट्रीम चाहिए?",
                "क्या मैं 11वीं के बाद स्ट्रीम बदल सकता हूँ?",
                "कॉमर्स के साथ गणित के लिए कितने अंक चाहिए?",
            ]
            return reply, follow_ups, top_career_ids[:2]

        if language == "hi":
            reply = (
                "कक्षा 11वीं में स्ट्रीम चुनना आपकी रुचि और एप्टीट्यूड पर निर्भर करता है। "
                "**PCM** इंजीनियरिंग और तकनीकी क्षेत्रों के रास्ते खोलता है। "
                "**PCB** मेडिकल और बायोसाइंस के लिए है। "
                "**Commerce** वित्त, सीए और प्रबंधन के लिए उपयुक्त है। "
                "**Arts** कानून, सिविल सेवा और मीडिया के लिए शानदार है। "
                "सटीक सुझाव के लिए पहले एप्टीट्यूड टेस्ट पूरा करें!"
            )
        else:
            reply = (
                "Choosing a stream depends on your natural strengths and interests.\n\n"
                "**PCM** opens doors to engineering, technology, and architecture.\n\n"
                "**PCB** leads to medicine, pharmacy, and biotech.\n\n"
                "**Commerce** powers careers in finance, CA, and management.\n\n"
                "**Arts** suits students strong in critical thinking, law, and media."
            )
        follow_ups = [
            "What does the PathFinder aptitude test measure?",
            "What career options exist in Commerce without Maths?",
            "How should I decide between PCM and PCB?",
        ] if language != "hi" else [
            "PathFinder एप्टीट्यूड टेस्ट में क्या शामिल है?",
            "बिना गणित के कॉमर्स में क्या विकल्प हैं?",
            "PCM और PCB में से कैसे चुनें?",
        ]
        return reply, follow_ups, []

    # 2. Class 10 Choices
    if _match_whole_words(["class 10", "after 10", "10th", "boards"], q):
        if language == "hi":
            reply = (
                "कक्षा 10वीं के बाद आपके पास मुख्य विकल्प होते हैं:\n\n"
                "**विज्ञान (PCM/PCB)** — इंजीनियरिंग या मेडिकल डिग्री के लिए।\n\n"
                "**कॉमर्स** — सीए, बैंकिंग, वित्त या व्यावसायिक प्रबंधन के लिए।\n\n"
                "**कला/मानविकी** — कानून, डिजाइन, पत्रकारिता या सिविल सेवा के लिए।\n\n"
                "उन विषयों को चुनें जिनमें आप रुचि रखते हैं और अच्छा प्रदर्शन करते हैं।"
            )
        else:
            reply = (
                "After Class 10, students in India choose between:\n\n"
                "**Science (PCM/PCB)** — for engineering, technology, or healthcare.\n\n"
                "**Commerce** — for CA, corporate finance, or business analytics.\n\n"
                "**Arts / Humanities** — for law, design, civil services, or journalism.\n\n"
                "Pick subjects where you enjoy regular problem-solving and study comfortably."
            )
        follow_ups = [
            "What if I score below 70% in Class 10?",
            "What are the benefits of taking Commerce with Maths?",
            "How do I choose between Science and Commerce?",
        ] if language != "hi" else [
            "अगर 10वीं में 70% से कम आएं तो क्या विकल्प हैं?",
            "गणित के साथ कॉमर्स के क्या फायदे हैं?",
            "साइंस और कॉमर्स में से कैसे चुनें?",
        ]
        return reply, follow_ups, []

    # 3. Entrance Exams (JEE, NEET, CLAT, etc.)
    if _match_whole_words(["jee", "neet", "entrance", "exam", "clat", "cuet", "upsc"], q):
        if language == "hi":
            reply = (
                "भारत की प्रमुख राष्ट्रीय प्रवेश परीक्षाएं:\n\n"
                "**इंजीनियरिंग:** JEE Main (NITs/IIITs) और JEE Advanced (IITs)\n\n"
                "**मेडिकल:** NEET-UG (MBBS और BDS के लिए राष्ट्रीय परीक्षा)\n\n"
                "**कानून:** CLAT (नेशनल लॉ यूनिवर्सिटीज के लिए)\n\n"
                "**सिविल सेवा:** UPSC CSE (ग्रेजुएशन के बाद)\n\n"
                "JEE और NEET की बुनियादी तैयारी कक्षा 11वीं से ही शुरू कर देनी चाहिए।"
            )
        else:
            reply = (
                "Here is an overview of major national entrance exams:\n\n"
                "**Engineering:** JEE Main (NIT/IIIT) and JEE Advanced (IIT)\n\n"
                "**Medicine:** NEET-UG (single gateway for all medical seats)\n\n"
                "**Law:** CLAT (for National Law Universities)\n\n"
                "**Central Universities:** CUET (for DU, BHU, and central universities)\n\n"
                "For JEE and NEET, conceptual mastery from Class 11 is essential."
            )
        follow_ups = [
            "How do I balance board prep with JEE/NEET?",
            "What is the exam pattern for CLAT?",
            "When should I start preparing for CUET?",
        ] if language != "hi" else [
            "बोर्ड और JEE/NEET की तैयारी में संतुलन कैसे बनाएं?",
            "CLAT परीक्षा का पैटर्न क्या है?",
            "CUET की तैयारी कब शुरू करनी चाहिए?",
        ]
        return reply, follow_ups, []

    # 4. Data Science & AI (BUGFIX: whole-word matching prevents 'ai' matching 'again' or 'explain')
    if _match_whole_words(["data science", "data scientist", "ai", "artificial intelligence", "machine learning"], q):
        if language == "hi":
            reply = (
                "**डेटा साइंस और एआई** भारत में तेजी से बढ़ते क्षेत्र हैं:\n\n"
                "**आधार:** कक्षा 11-12 में मजबूत गणित (सांख्यिकी और कैलकुलस)।\n\n"
                "**डिग्री:** B.Tech CSE, B.Sc डेटा साइंस, या B.Sc सांख्यिकी।\n\n"
                "**शुरुआती वेतन:** ₹8L–15L पैकेज, जो अनुभव के साथ काफी बढ़ता है।\n\n"
                "क्या आप डेटा साइंटिस्ट का विस्तृत रोडमैप देखना चाहते हैं?"
            )
        else:
            reply = (
                "**Data Science and AI** are high-growth fields in India.\n\n"
                "**Foundation:** Strong Mathematics in Class 11–12, focusing on Statistics and Calculus.\n\n"
                "**Degree Pathways:** B.Tech CSE, B.Sc Statistics, or B.Sc Data Science.\n\n"
                "**Skills to Master:** Python, SQL, and Machine Learning libraries.\n\n"
                "Entry compensation averages **₹8L–15L** and expands rapidly with production experience."
            )
        follow_ups = [
            "What entrance exams lead to AI degrees?",
            "Can I study Data Science without coding experience?",
            "What is the difference between AI and Software Engineering?",
        ] if language != "hi" else [
            "AI डिग्री के लिए कौन सी प्रवेश परीक्षा देनी होती है?",
            "क्या बिना कोडिंग अनुभव के डेटा साइंस सीख सकते हैं?",
            "AI और सॉफ्टवेयर इंजीनियरिंग में क्या अंतर है?",
        ]
        return reply, follow_ups, ["data_scientist", "software_engineer"]

    # 5. Doctor & Medicine
    if _match_whole_words(["doctor", "medicine", "mbbs", "medical", "neet"], q):
        if language == "hi":
            reply = (
                "भारत में **डॉक्टर (MBBS)** बनने की आवश्यक प्रक्रिया:\n\n"
                "**कक्षा 11-12:** PCB (भौतिकी, रसायन, जीवविज्ञान) के साथ पढ़ाई करें।\n\n"
                "**प्रवेश परीक्षा:** NEET-UG एकमात्र राष्ट्रीय प्रवेश परीक्षा है।\n\n"
                "**अवधि:** 5.5 वर्ष (4.5 वर्ष पाठ्यक्रम + 1 वर्ष अनिवार्य इंटर्नशिप)।\n\n"
                "एम्स (AIIMS) और जिपमेर (JIPMER) देश के प्रमुख संस्थान हैं।"
            )
        else:
            reply = (
                "Becoming a **Doctor (MBBS)** in India requires sustained commitment.\n\n"
                "**Class 11–12:** Science with PCB (Physics, Chemistry, and Biology).\n\n"
                "**Entrance Test:** NEET-UG is the sole qualifying exam for MBBS/BDS seats.\n\n"
                "**Course Duration:** 5.5 years (4.5 years academic study plus 1-year rotatory internship).\n\n"
                "Top medical colleges include AIIMS New Delhi and JIPMER Puducherry."
            )
        follow_ups = [
            "What NEET score is needed for government medical colleges?",
            "What alternatives to MBBS exist in healthcare?",
            "How demanding is the MBBS internship?",
        ] if language != "hi" else [
            "सरकारी मेडिकल कॉलेज के लिए NEET में कितने अंक चाहिए?",
            "स्वास्थ्य क्षेत्र में MBBS के अलावा क्या विकल्प हैं?",
            "MBBS की इंटर्नशिप कितनी कठिन होती है?",
        ]
        return reply, follow_ups, ["doctor", "physiotherapist"]

    # 6. Engineering & Software
    if _match_whole_words(["engineer", "engineering", "software", "programmer", "coding", "developer"], q):
        if language == "hi":
            reply = (
                "**सॉफ्टवेयर व कोर इंजीनियरिंग** भारत के सबसे लोकप्रिय क्षेत्रों में हैं:\n\n"
                "**स्ट्रीम:** कक्षा 11वीं में PCM अनिवार्य है।\n\n"
                "**प्रवेश परीक्षाएं:** IIT/NIT के लिए JEE Main और JEE Advanced।\n\n"
                "**मुख्य शाखाएं:** कंप्यूटर साइंस, डेटा साइंस, इलेक्ट्रॉनिक्स, मैकेनिकल।\n\n"
                "कौशल और व्यावहारिक प्रोजेक्ट्स कैंपस प्लेसमेंट में सबसे महत्वपूर्ण होते हैं।"
            )
        else:
            reply = (
                "**Engineering & Technology** paths require focused groundwork:\n\n"
                "**Stream:** Science with PCM in Class 11–12.\n\n"
                "**Gateways:** JEE Main and JEE Advanced for premier institutes (IITs, NITs, IIITs).\n\n"
                "**Key Branches:** Computer Science, Artificial Intelligence, Electronics, and Mechanical.\n\n"
                "Entry salaries range from ₹5L–12L at tier-1/tier-2 colleges."
            )
        follow_ups = [
            "What computer languages should I learn before college?",
            "How do IIT admissions differ from NIT admissions?",
            "Is B.Tech Computer Science hard for beginners?",
        ] if language != "hi" else [
            "कॉलेज से पहले कौन सी कोडिंग भाषा सीखनी चाहिए?",
            "IIT और NIT प्रवेश में क्या अंतर है?",
            "क्या B.Tech CS शुरुआती छात्रों के लिए कठिन है?",
        ]
        return reply, follow_ups, ["software_engineer", "game_developer"]

    # 7. Civil Services (IAS / UPSC)
    if _match_whole_words(["ias", "upsc", "civil services", "civil service", "ips"], q):
        if language == "hi":
            reply = (
                "**सिविल सेवा (UPSC CSE)** की मुख्य बातें:\n\n"
                "**योग्यता:** किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation)।\n\n"
                "**चरण:** प्रारंभिक परीक्षा (Prelims), मुख्य परीक्षा (Mains), और साक्षात्कार (Interview)।\n\n"
                "**तैयारी:** NCERT पुस्तकों (कक्षा 6 से 12) और दैनिक समाचार पत्रों से शुरुआत करें।\n\n"
                "स्कूल स्तर पर पढ़ने की आदत और सामान्य ज्ञान विकसित करने पर ध्यान दें।"
            )
        else:
            reply = (
                "The **Civil Services (UPSC CSE)** is a premier administrative career in India.\n\n"
                "**Eligibility:** Any recognized undergraduate bachelor degree (any stream).\n\n"
                "**Selection:** 3 stages — Preliminary examination, Main written exams, and Personality Interview.\n\n"
                "**Preparation Base:** Master NCERT fundamentals across history, polity, and geography.\n\n"
                "Focus in school on deep reading habits and clear analytical writing."
            )
        follow_ups = [
            "Which graduation degree is best for UPSC preparation?",
            "At what age can I attempt the UPSC exam?",
            "How should school students start preparing for civil services?",
        ] if language != "hi" else [
            "UPSC की तैयारी के लिए कौन सी ग्रेजुएशन डिग्री बेहतर है?",
            "UPSC परीक्षा किस उम्र में दे सकते हैं?",
            "स्कूल के छात्र सिविल सेवा की तैयारी कैसे शुरू करें?",
        ]
        return reply, follow_ups, ["civil_services_ias"]

    # 8. Salary & Compensation Outlook
    if _match_whole_words(["salary", "earn", "money", "pay", "income", "package", "lpa"], q):
        if has_results and top_str:
            if language == "hi":
                reply = (
                    f"आपके शीर्ष मेल खाने वाले करियर (**{top_str}**) में दीर्घकालिक कमाई की उत्कृष्ट संभावनाएं हैं। "
                    "भारत में अनुभव और सिद्ध कौशल के साथ वेतन में 3 से 5 गुना तक वृद्धि होती है। "
                    "प्रारंभिक पैकेज ₹5L–12L से शुरू होकर वरिष्ठ पदों पर ₹25L–60L+ तक पहुंचते हैं।"
                )
            else:
                reply = (
                    f"Your top matching careers — **{top_str}** — feature solid earning trajectories.\n\n"
                    "In India, compensation scales strongly with skill mastery, college tier, and practical projects. "
                    "Entry packages average **₹5L–12L** annually, with experienced roles expanding significantly over 4 to 6 years."
                )
            follow_ups = [
                "Which career in my top matches pays highest initially?",
                "How do Tier-1 and Tier-2 college salaries compare?",
                "What skills lead to faster salary growth in tech?",
            ] if language != "hi" else [
                "मेरे शीर्ष करियर में सबसे अधिक शुरुआती वेतन किसका है?",
                "टियर-1 और टियर-2 कॉलेज के वेतन में कितना अंतर होता है?",
                "टेक में तेजी से वेतन वृद्धि के लिए कौन से कौशल जरूरी हैं?",
            ]
            return reply, follow_ups, top_career_ids[:2]

        if language == "hi":
            reply = (
                "भारत में विभिन्न क्षेत्रों के प्रारंभिक और वरिष्ठ वेतन का अनुमान:\n\n"
                "**टेक्नोलॉजी व AI:** ₹5L–15L प्रारंभिक, ₹20L–60L+ वरिष्ठ\n\n"
                "**चिकित्सा (MBBS):** ₹6L–10L प्रारंभिक, विशेषज्ञता के बाद उच्च वृद्धि\n\n"
                "**फाइनेंस व CA:** ₹7L–12L प्रारंभिक, ₹25L–50L+ वरिष्ठ\n\n"
                "**सिविल सेवा:** 7वें वेतन आयोग के अनुसार निर्धारित वेतन + भत्ते"
            )
        else:
            reply = (
                "Compensation benchmarks vary across Indian career sectors:\n\n"
                "**Technology & Data Science:** ₹5L–15L entry, scaling to ₹20L–60L+ senior.\n\n"
                "**Healthcare & Medicine:** ₹6L–10L starting post-internship, growing with MD/MS specialisation.\n\n"
                "**Finance & CA:** ₹7L–12L starting, expanding rapidly with corporate advisory.\n\n"
                "Pick an area where you naturally excel to ensure consistent long-term growth."
            )
        follow_ups = [
            "How does college ranking affect starting salary?",
            "What are the highest-paying careers in Commerce?",
            "Can I earn well in creative and design fields?",
        ] if language != "hi" else [
            "कॉलेज रैंकिंग से शुरुआती पैकेज पर कितना फर्क पड़ता है?",
            "कॉमर्स में सबसे अधिक वेतन वाले करियर कौन से हैं?",
            "क्या डिजाइन और रचनात्मक क्षेत्रों में अच्छी कमाई होती है?",
        ]
        return reply, follow_ups, []

    # 9. Personalised Fallback (when results/careers exist)
    if has_results and top_str:
        if language == "hi":
            reply = (
                f"यह एक बहुत अच्छा प्रश्न है! आपके एप्टीट्यूड टेस्ट के आधार पर, आपका प्रोफाइल विशेष रूप से **{top_str}** के अनुकूल है। "
                "मैं आपको स्ट्रीम चयन, प्रवेश परीक्षाओं (जैसे JEE, NEET, CLAT, CUET) या कक्षा 10वीं/12वीं के बाद की रणनीति में मदद कर सकता हूँ। "
                "आप किस विषय पर और जानना चाहते हैं?"
            )
        else:
            reply = (
                f"That is a thoughtful question! Based on your aptitude assessment score of **{score if score is not None else 75}%**, "
                f"your profile aligns promisingly with **{top_str}**.\n\n"
                "I can help guide you through subject selection, entrance exam plans, top college pathways, or roadmaps for Class 9 to 12. "
                "What would you like to explore next?"
            )
        follow_ups = [
            f"Tell me about becoming a {top_career_titles[0]}",
            "What subjects should I focus on in Class 11?",
            "What entrance exams do I need to prepare for?",
        ] if language != "hi" else [
            f"{top_career_titles[0]} के बारे में विस्तार से बताएं",
            "कक्षा 11वीं में मुझे किन विषयों पर ध्यान देना चाहिए?",
            "मुझे किन प्रवेश परीक्षाओं की तैयारी करनी चाहिए?",
        ]
        return reply, follow_ups, top_career_ids[:2]

    # 10. Generic Fallback (no assessment results)
    if language == "hi":
        reply = (
            "नमस्ते! मैं आपका PathFinder AI करियर काउंसलर हूँ।\n\n"
            "सटीक और व्यक्तिगत सलाह के लिए मैं आपको पहले PathFinder एप्टीट्यूड टेस्ट लेने का सुझाव दूंगा।\n\n"
            "मैं आपकी मदद कर सकता हूँ:\n\n"
            "**स्ट्रीम चुनना** — साइंस, कॉमर्स या आर्ट्स में से सही रास्ता तय करना।\n\n"
            "**प्रवेश परीक्षाएं** — JEE, NEET, CLAT, CUET आदि की जानकारी।\n\n"
            "आप किस करियर या विषय के बारे में जानना चाहते हैं?"
        )
    else:
        reply = (
            "Hello! I am your PathFinder AI Career Counsellor.\n\n"
            "To give you personalised recommendations, I suggest taking the PathFinder aptitude test first.\n\n"
            "In the meantime, I can assist you with:\n\n"
            "**Stream Selection** — Choosing between Science, Commerce, and Arts.\n\n"
            "**Entrance Examinations** — Understanding JEE, NEET, CLAT, and CUET.\n\n"
            "**College Pathways** — Choosing degrees and institutions for Class 8 to 12 students.\n\n"
            "What would you like to know more about?"
        )
    follow_ups = [
        "Which stream should I choose after 10th?",
        "What entrance exam is needed for engineering?",
        "How does the PathFinder aptitude test work?",
    ] if language != "hi" else [
        "10वीं के बाद कौन सी स्ट्रीम चुनूँ?",
        "इंजीनियरिंग के लिए कौन सी प्रवेश परीक्षा होती है?",
        "PathFinder एप्टीट्यूड टेस्ट कैसे काम करता है?",
    ]
    return reply, follow_ups, []
