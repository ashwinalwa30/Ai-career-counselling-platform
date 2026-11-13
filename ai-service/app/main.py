"""FastAPI entrypoint. Scoring and recommendation routes are not mounted yet."""

from __future__ import annotations

import collections
from contextlib import asynccontextmanager
from pathlib import Path
import re
import time
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.analysis import build_analysis
from app.chat.context_builder import build_counsellor_context
from app.chat.fallback import get_counsellor_fallback
from app.chatbot import chat_counsellor
from app.config import settings
from app.data_loader import get_questions, load_data
from app.explain import explain_career
from app.llm.provider import NullProvider, get_llm_provider
from app.recommend import recommend_careers
from app.roadmap import personalize_roadmap
from app.schemas import (
    ApiEnvelope,
    AssessRequest,
    AssessResult,
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    RecommendRequest,
    RoadmapRequest,
    RoadmapResponse,
)
from app.scoring import (
    calculate_overall_score,
    calculate_riasec_percents,
    calculate_riasec_scores,
    calculate_section_scores,
    get_completed_at,
    get_strengths_and_weaknesses,
    get_top_riasec_types,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_data()
    yield


app = FastAPI(title="PathFinder AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "message": message},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return _error(exc.status_code, detail)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    parts: list[str] = []
    for err in exc.errors():
        loc = ".".join(str(item) for item in err.get("loc", []) if item != "body")
        parts.append(f"{loc}: {err.get('msg')}" if loc else str(err.get("msg")))
    message = "; ".join(parts) or "Invalid request"
    return _error(422, message)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return _error(500, "Internal server error")


@app.get("/ai/health")
def health() -> dict:
    return {
        "success": True,
        "data": {
            "status": "ok",
            "llm_configured": settings.llm_configured,
        },
        "message": "AI service is running",
    }


@app.post("/ai/assess", response_model=ApiEnvelope)
def assess(req: AssessRequest) -> ApiEnvelope:
    questions = get_questions()
    section_scores = calculate_section_scores(req.answers, questions)
    overall_score = calculate_overall_score(section_scores)
    riasec_scores = calculate_riasec_scores(req.answers, questions)
    riasec_percents = calculate_riasec_percents(riasec_scores)
    profile_interests = req.profile.interests if req.profile else None
    top_types = get_top_riasec_types(riasec_percents, profile_interests, limit=2)
    strengths, weaknesses, strengths_are_relative = get_strengths_and_weaknesses(section_scores)
    completed_at = get_completed_at()

    analysis = build_analysis(
        section_scores=section_scores,
        riasec_percents=riasec_percents,
        top_types=top_types,
        strengths=strengths,
        strengths_are_relative=strengths_are_relative,
        answers=req.answers,
        questions=questions,
        profile=req.profile,
        language=req.language,
    )

    result = AssessResult(
        overallScore=overall_score,
        sectionScores=section_scores,
        riasecScores=riasec_scores,
        riasecPercent=riasec_percents,
        topTypes=top_types,
        strengths=strengths,
        weaknesses=weaknesses,
        completedAt=completed_at,
        analysis=analysis,
    )

    return ApiEnvelope(
        success=True,
        data=result.model_dump(),
        message="Assessment scored successfully",
    )


@app.post("/ai/recommendations", response_model=ApiEnvelope)
@app.post("/ai/recommend", response_model=ApiEnvelope)
def get_recommendations(req: RecommendRequest) -> ApiEnvelope:
    data = recommend_careers(
        result=req.result,
        profile=req.profile,
        language=req.language,
    )
    return ApiEnvelope(
        success=True,
        data=data,
        message="Recommendations calculated successfully",
    )


@app.post("/ai/explain", response_model=ApiEnvelope)
def get_career_explanation(req: ExplainRequest) -> ApiEnvelope:
    data = explain_career(
        career_id=req.careerId,
        result=req.result,
        match=req.match,
        profile=req.profile,
        language=req.language,
        polish=req.polish,
        top_picks=req.topPicks,
    )
    return ApiEnvelope(
        success=True,
        data=data.model_dump(),
        message="Career match explanation generated successfully",
    )


@app.post("/ai/roadmap", response_model=ApiEnvelope)
def get_career_roadmap(req: RoadmapRequest) -> ApiEnvelope:
    data = personalize_roadmap(
        career_id=req.careerId,
        result=req.result,
        profile=req.profile,
        language=req.language,
        polish=req.polish,
    )
    return ApiEnvelope(
        success=True,
        data=data.model_dump(),
        message="Personalised roadmap generated successfully",
    )


# ── In-Memory Rate Limiter (20 requests per minute per IP) ─────────────────
_rate_limit_records: dict[str, collections.deque[float]] = collections.defaultdict(collections.deque)
RATE_LIMIT_WINDOW = 60.0
RATE_LIMIT_MAX = 20


def is_rate_limited(ip: str) -> bool:
    now = time.time()
    records = _rate_limit_records[ip]
    while records and records[0] <= now - RATE_LIMIT_WINDOW:
        records.popleft()
    if len(records) >= RATE_LIMIT_MAX:
        return True
    records.append(now)
    return False


def clean_counsellor_formatting(text: str) -> str:
    """Format strictly with plain text, bold, and linebreaks (no headings, tables, or lists)."""
    # Convert headings `# ...` to `**...**`
    text = re.sub(r"^#{1,6}\s+(.+)$", r"**\1**", text, flags=re.MULTILINE)
    # Strip markdown table rows and pipes
    text = re.sub(r"\|[ -|]+\|", "", text)
    text = re.sub(r"\|", " ", text)
    # Strip bullet points and numbered list markers
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)
    # Strip markdown links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Collapse excess empty lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


SYSTEM_PROMPT_PATH = Path(__file__).parent / "prompts" / "counsellor_system.md"
_system_prompt_cache: str | None = None


def get_counsellor_system_prompt() -> str:
    global _system_prompt_cache
    if _system_prompt_cache is None:
        if SYSTEM_PROMPT_PATH.exists():
            _system_prompt_cache = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
        else:
            _system_prompt_cache = (
                "You are a warm, honest career counsellor for Indian students aged 13 to 18."
            )
    return _system_prompt_cache


@app.post("/ai/chat", response_model=ApiEnvelope)
def chat(req: ChatRequest, request: Request) -> JSONResponse:
    # 1. Rate limiting
    client_ip = request.client.host if request.client else "127.0.0.1"
    if is_rate_limited(client_ip):
        return _error(429, "Rate limit exceeded. Maximum 20 requests per minute.")

    # 2. Input sanitization (strip HTML, reject empty)
    clean_msg = re.sub(r"<script.*?>.*?</script>", "", req.message, flags=re.DOTALL | re.IGNORECASE)
    clean_msg = re.sub(r"<style.*?>.*?</style>", "", clean_msg, flags=re.DOTALL | re.IGNORECASE)
    clean_msg = re.sub(r"<[^>]+>", "", clean_msg)
    clean_msg = re.sub(r"\s+", " ", clean_msg).strip()
    if not clean_msg:
        return _error(400, "Message cannot be empty.")

    # 3. Truncate history (keep last 8 turns)
    recent_history = req.history[-8:] if req.history else []

    # 4. Deterministic context building (~1,500 tokens)
    context_block = build_counsellor_context(clean_msg, recent_history, req.context)

    # 5. Provider generation or fallback
    provider = get_llm_provider()
    reply_text = ""
    source: Literal["llm", "fallback"] = "fallback"
    suggested_follow_ups: list[str] = []
    cited_career_ids: list[str] = []

    if not isinstance(provider, NullProvider):
        system_instructions = (
            f"{get_counsellor_system_prompt()}\n\n"
            f"Language: {'Hindi (Devanagari script)' if req.language == 'hi' else 'English'}\n\n"
            f"{context_block}"
        )
        messages = [{"role": turn.role, "content": turn.content} for turn in recent_history]
        messages.append({"role": "user", "content": clean_msg})

        try:
            raw_llm = provider.generate(system=system_instructions, messages=messages, timeout=15.0)
            if raw_llm and len(raw_llm.strip()) > 20:
                reply_text = clean_counsellor_formatting(raw_llm)
                source = "llm"
                _, suggested_follow_ups, cited_career_ids = get_counsellor_fallback(
                    clean_msg, req.context, req.language
                )
        except Exception:
            pass

    if not reply_text:
        fb_reply, suggested_follow_ups, cited_career_ids = get_counsellor_fallback(
            clean_msg, req.context, req.language
        )
        reply_text = clean_counsellor_formatting(fb_reply)
        source = "fallback"

    return JSONResponse(
        status_code=200,
        content=ApiEnvelope(
            success=True,
            data=ChatResponse(
                reply=reply_text,
                source=source,
                suggestedFollowUps=suggested_follow_ups,
                citedCareerIds=cited_career_ids,
            ).model_dump(),
            message="Chat response generated successfully",
        ).model_dump(mode="json"),
    )
