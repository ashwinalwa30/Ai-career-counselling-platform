"""FastAPI entrypoint. Scoring and recommendation routes are not mounted yet."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.analysis import build_analysis
from app.config import settings
from app.data_loader import get_questions, load_data
from app.explain import explain_career
from app.recommend import recommend_careers
from app.schemas import (
    ApiEnvelope,
    AssessRequest,
    AssessResult,
    ExplainRequest,
    ExplainResponse,
    RecommendRequest,
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
