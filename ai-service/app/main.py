"""FastAPI entrypoint. Scoring and recommendation routes are not mounted yet."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.data_loader import load_data


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
