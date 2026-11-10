"""Request and response contracts for the PathFinder AI service.

Field names match the frontend mock API. New information is added as extra
fields; nothing here renames or removes a field the UI already reads.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Language = Literal["en", "hi"]
ReplySource = Literal["llm", "fallback"]


class ApiEnvelope(BaseModel):
    """Every HTTP body uses this wrapper. Errors set success false and data null."""

    success: bool
    data: Any | None = None
    message: str


class SubjectMarks(BaseModel):
    maths: int | None = Field(default=None, ge=0, le=100)
    science: int | None = Field(default=None, ge=0, le=100)
    english: int | None = Field(default=None, ge=0, le=100)
    socialScience: int | None = Field(default=None, ge=0, le=100)
    secondLanguage: int | None = Field(default=None, ge=0, le=100)
    computer: int | None = Field(default=None, ge=0, le=100)


class StudentProfile(BaseModel):
    """Student fields the frontend already stores. Extra auth fields are ignored."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    student_class: str | None = Field(
        default=None,
        alias="class",
        pattern=r"^(8|9|10|11|12)$",
    )
    board: str | None = None
    state: str | None = None
    preferredLanguage: Literal["English", "Hindi"] | None = None
    interests: list[str] = Field(default_factory=list)
    subjectMarks: SubjectMarks | None = None


class AssessRequest(BaseModel):
    answers: dict[str, str | None]
    profile: StudentProfile | None = None
    language: Language = "en"


class AssessResult(BaseModel):
    """The seven fields Results already reads, plus an optional analysis object."""

    overallScore: int
    sectionScores: dict[str, int]
    riasecScores: dict[str, int]
    topTypes: list[str]
    strengths: list[str]
    weaknesses: list[str]
    completedAt: str
    analysis: dict[str, Any] | None = None


class RecommendRequest(BaseModel):
    result: AssessResult
    profile: StudentProfile | None = None
    language: Language = "en"


class CareerMatch(BaseModel):
    id: str
    matchPct: int | None = Field(default=None, ge=0, le=100)
    rank: int = Field(ge=1)
    breakdown: dict[str, Any] = Field(default_factory=dict)
    reasons: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)


class ExplainRequest(BaseModel):
    careerId: str
    result: AssessResult
    profile: StudentProfile | None = None
    language: Language = "en"


class ExplainResponse(BaseModel):
    careerId: str
    explanation: str
    reasons: list[str] = Field(default_factory=list)
    source: ReplySource


class RoadmapStep(BaseModel):
    step: int
    stage: str
    title: str
    desc: str


class RoadmapRequest(BaseModel):
    careerId: str
    result: AssessResult | None = None
    profile: StudentProfile | None = None
    language: Language = "en"


class RoadmapResponse(BaseModel):
    careerId: str
    steps: list[RoadmapStep]
    source: ReplySource


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = Field(default_factory=list)
    context: dict[str, Any] | None = None
    language: Language = "en"


class ChatResponse(BaseModel):
    reply: str
    source: ReplySource
