"""Career match explanation engine (POST /ai/explain).

Generates deterministic, student-friendly explanations in English and Hindi.
Step A: Pure rule-based templates citing real student scores, with deterministic what-if simulations.
Step B: Optional LLM polish with strict grounding verification.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.analysis import RIASEC_NAMES, SECTION_NAMES
from app.data_loader import get_careers
from app.llm_client import generate_completion
from app.recommend import recommend_careers
from app.schemas import (
    AssessResult,
    CareerMatch,
    ExplainResponse,
    Language,
    StudentProfile,
)


def _extract_numbers(text: str) -> set[int]:
    """Extract all integer numbers from text."""
    return {int(n) for n in re.findall(r"\b\d+\b", text)}


def explain_career(
    career_id: str,
    result: AssessResult,
    match: CareerMatch | dict[str, Any] | None = None,
    profile: StudentProfile | None = None,
    language: Language = "en",
    polish: bool = False,
    top_picks: list[str] | None = None,
) -> ExplainResponse:
    """Generate career fit explanation adhering to Step A (rules) and optional Step B (LLM polish)."""
    careers = get_careers()
    careers_by_id = {c["id"]: c for c in careers}

    career = careers_by_id.get(career_id)
    if not career:
        raise ValueError(f"Unknown career ID: {career_id}")

    title = career.get("title", career_id)
    req_aptitudes = career.get("requiredAptitudes", [])
    riasec_types = career.get("riasecTypes", [])

    # If match or top_picks not provided, compute live
    if match is None or top_picks is None:
        rec_data = recommend_careers(result, profile, language)
        if match is None:
            match_data = next((c for c in rec_data["careers"] if c["id"] == career_id), None)
            match = match_data if match_data else {"matchPct": 50, "confidence": "medium"}
        if top_picks is None:
            top_picks = rec_data.get("topPicks", [])

    match_dict = match.model_dump() if isinstance(match, CareerMatch) else match
    match_pct = int(match_dict.get("matchPct", 50))
    confidence_val = str(match_dict.get("confidence", "medium"))

    # ══════════════════════════════════════════════════════════════════════════
    # STEP A: DETERMINISTIC RULE-BASED GENERATION
    # ══════════════════════════════════════════════════════════════════════════

    # 1. Headline
    if match_pct < 50:
        # Weaker match: must state it is weaker and name better alternatives from topPicks
        better_ids = [pid for pid in top_picks if pid != career_id][:2]
        better_titles = [careers_by_id[pid]["title"] for pid in better_ids if pid in careers_by_id]
        better_str = " and ".join(better_titles) if better_titles else "other recommended paths"
        better_str_hi = " और ".join(better_titles) if better_titles else "अन्य अनुशंसित विकल्प"

        if language == "hi":
            headline = f"{title} आपके वर्तमान एप्टीट्यूड प्रोफाइल के अनुसार एक कमजोर विकल्प ({match_pct}%) है। आपके लिए {better_str_hi} जैसे करियर इस समय कहीं अधिक उपयुक्त हैं।"
        else:
            headline = f"{title} is currently a weaker match ({match_pct}%) based on your aptitude profile. Careers like {better_str} are much stronger fits for you right now."
    else:
        top_strength = result.strengths[0] if result.strengths else (req_aptitudes[0] if req_aptitudes else "logical_reasoning")
        top_strength_label = SECTION_NAMES.get(top_strength, {}).get(language, top_strength.replace("_", " ").title())

        if language == "hi":
            headline = f"{title} आपके प्रोफाइल के लिए एक मजबूत विकल्प ({match_pct}%) है, जो {top_strength_label} में आपकी दक्षता से बहुत अच्छी तरह मेल खाता है।"
        else:
            headline = f"{title} is a strong match ({match_pct}%) for your profile, aligning closely with your aptitude in {top_strength_label}."

    # 2. whyItFits: Exactly 3 lines, each citing a real student number
    why_it_fits: list[str] = []

    # Line 1: Primary required aptitude
    if req_aptitudes:
        sec1 = req_aptitudes[0]
        s1 = result.sectionScores.get(sec1, 0)
        s1_label = SECTION_NAMES.get(sec1, {}).get(language, sec1.replace("_", " ").title())
        if language == "hi":
            why_it_fits.append(f"{s1_label} में आपका {s1}% का स्कोर {title} के मूलभूत कार्यों के लिए आवश्यक मजबूत आधार प्रदान करता है।")
        else:
            why_it_fits.append(f"Your {s1_label} score of {s1}% provides the core analytical foundation needed for {title}.")

    # Line 2: Secondary required aptitude (or overall score if unavailable)
    if len(req_aptitudes) > 1:
        sec2 = req_aptitudes[1]
        s2 = result.sectionScores.get(sec2, 0)
        s2_label = SECTION_NAMES.get(sec2, {}).get(language, sec2.replace("_", " ").title())
        if language == "hi":
            why_it_fits.append(f"{s2_label} में आपका {s2}% का स्कोर इस क्षेत्र की प्रमुख तकनीकी व विश्लेषणात्मक चुनौतियों को हल करने में मदद करेगा।")
        else:
            why_it_fits.append(f"Your {s2_label} score of {s2}% equips you well for key problem-solving challenges in this domain.")
    else:
        overall = result.overallScore
        if language == "hi":
            why_it_fits.append(f"आपका समग्र बौद्धिक स्कोर {overall}% रहा, जो सामान्य शैक्षणिक तत्परता को दर्शाता है।")
        else:
            why_it_fits.append(f"Your overall cognitive score of {overall}% demonstrates general readiness for higher studies in this stream.")

    # Line 3: RIASEC interest alignment
    if riasec_types:
        t1 = riasec_types[0]
        t1_label = RIASEC_NAMES.get(t1, {}).get(language, t1)
        r_pct = result.riasecPercent.get(t1, 0) if result.riasecPercent else int(round((result.riasecScores.get(t1, 0) / 8.0) * 100))
        if language == "hi":
            why_it_fits.append(f"आपकी {t1_label} रुचि का {r_pct}% स्कोर उस दृष्टिकोण से मेल खाता है जिसकी आवश्यकता {title} में दैनिक रूप से होती है।")
        else:
            why_it_fits.append(f"Your {t1_label} interest score of {r_pct}% matches the problem-solving style that professionals in {title} use daily.")

    # Ensure exactly 3 lines
    while len(why_it_fits) < 3:
        overall = result.overallScore
        if language == "hi":
            why_it_fits.append(f"एप्टीट्यूड मूल्यांकन में आपका {overall}% का कुल स्कोर इस करियर की दिशा में निरंतर विकास का आधार है।")
        else:
            why_it_fits.append(f"Your cumulative aptitude score of {overall}% provides a solid baseline for ongoing skill building in this path.")
    why_it_fits = why_it_fits[:3]

    # 3. watchOuts: 0 to 2 lines
    watch_outs: list[str] = []
    for sec in req_aptitudes:
        sec_score = result.sectionScores.get(sec, 0)
        if sec_score < 50:
            sec_label = SECTION_NAMES.get(sec, {}).get(language, sec.replace("_", " ").title())
            if language == "hi":
                watch_outs.append(f"{sec_label} वर्तमान में {sec_score}% पर है, जो इस करियर के लिए अनुशंसित 50% के स्तर से कम है।")
            else:
                watch_outs.append(f"{sec_label} is currently at {sec_score}%, which is below the recommended 50% baseline for this career.")
        if len(watch_outs) == 2:
            break

    # 4. whatWouldChange: deterministic what-if simulations
    what_would_change: list[str] = []
    gaps_to_test = [sec for sec in req_aptitudes if result.sectionScores.get(sec, 0) < 70]

    for gap_sec in gaps_to_test:
        old_score = result.sectionScores.get(gap_sec, 0)
        gap_label = SECTION_NAMES.get(gap_sec, {}).get(language, gap_sec.replace("_", " ").title())

        # Clone and re-run with score raised to 70
        sim_scores = dict(result.sectionScores)
        sim_scores[gap_sec] = 70
        sim_result = result.model_copy(update={"sectionScores": sim_scores})

        sim_rec = recommend_careers(sim_result, profile, language)
        sim_match = next((c["matchPct"] for c in sim_rec["careers"] if c["id"] == career_id), match_pct)

        if language == "hi":
            what_would_change.append(
                f"यदि आपका {gap_label} स्कोर {old_score}% से बढ़कर 70% हो जाता है, तो इस करियर के साथ आपका मैच {match_pct}% से बढ़कर {sim_match}% हो जाएगा।"
            )
        else:
            what_would_change.append(
                f"If your {gap_label} score rose from {old_score}% to 70%, this match would go from {match_pct}% to {sim_match}%."
            )

    # ══════════════════════════════════════════════════════════════════════════
    # STEP B: OPTIONAL LLM POLISH WITH STRICT GROUNDING CHECK
    # ══════════════════════════════════════════════════════════════════════════
    from app.config import settings

    if polish and settings.llm_configured:
        step_a_facts_text = " ".join([headline] + why_it_fits + watch_outs + what_would_change)
        step_a_numbers = _extract_numbers(step_a_facts_text)

        system_prompt = (
            "You are an encouraging mentor speaking warmly to a 14-year-old student. "
            "Reword the provided career explanation fields into friendly, warm language. "
            "STRICT RULES:\n"
            "1. NEVER invent or change any numbers. You must only use the numbers provided in the input text.\n"
            "2. NEVER invent new exam names, college names, or careers.\n"
            "3. Output strictly valid JSON matching this schema:\n"
            '{"headline": "...", "whyItFits": ["...", "...", "..."], "watchOuts": ["..."], "whatWouldChange": ["..."]}\n'
            f"4. Language: {'Hindi (Devanagari)' if language == 'hi' else 'English'}."
        )

        input_json_str = json.dumps({
            "headline": headline,
            "whyItFits": why_it_fits,
            "watchOuts": watch_outs,
            "whatWouldChange": what_would_change,
        })

        try:
            llm_raw = generate_completion(
                prompt=f"Please polish these fields while preserving all factual numbers:\n{input_json_str}",
                system_prompt=system_prompt,
                temperature=0.2,
            )
            if llm_raw:
                # Clean code fences if present
                clean_json = re.sub(r"^```(?:json)?\s*|\s*```$", "", llm_raw.strip(), flags=re.DOTALL)
                parsed = json.loads(clean_json)

                # Validate structure
                p_headline = str(parsed.get("headline", ""))
                p_why = list(parsed.get("whyItFits", []))
                p_watch = list(parsed.get("watchOuts", []))
                p_change = list(parsed.get("whatWouldChange", []))

                # Grounding check: verify every number in LLM output exists in Step A facts
                llm_all_text = " ".join([p_headline] + p_why + p_watch + p_change)
                llm_numbers = _extract_numbers(llm_all_text)

                if (
                    llm_numbers.issubset(step_a_numbers)
                    and len(p_why) == 3
                    and len(p_headline) > 10
                ):
                    return ExplainResponse(
                        headline=p_headline,
                        whyItFits=p_why,
                        watchOuts=p_watch,
                        whatWouldChange=p_change,
                        confidence=confidence_val,
                        source="llm",
                        careerId=career_id,
                    )
        except Exception:
            pass  # Grounding failed or JSON parse error -> fall back to Step A

    # Default to Step A rules output
    return ExplainResponse(
        headline=headline,
        whyItFits=why_it_fits,
        watchOuts=watch_outs,
        whatWouldChange=what_would_change,
        confidence=confidence_val,
        source="rules",
        careerId=career_id,
    )

