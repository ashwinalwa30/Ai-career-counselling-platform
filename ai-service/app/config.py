"""Environment settings.

The process must start when LLM_PROVIDER, LLM_API_KEY, LLM_MODEL, and
ALLOWED_ORIGINS are all unset. Empty LLM settings mean no model is configured.
"""

from __future__ import annotations

import os
from pathlib import Path

_SERVICE_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _SERVICE_ROOT / ".env"


def _load_env_file(path: Path) -> None:
    """Load ai-service/.env without overriding variables already in the environment."""
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


def _split_origins(raw: str | None) -> list[str]:
    if not raw or not raw.strip():
        return ["http://localhost:5173"]
    return [part.strip() for part in raw.split(",") if part.strip()]


class Settings:
    def __init__(self) -> None:
        _load_env_file(_ENV_FILE)
        self.LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "") or ""
        self.LLM_API_KEY: str = os.getenv("LLM_API_KEY", "") or ""
        self.LLM_MODEL: str = os.getenv("LLM_MODEL", "") or ""
        self.ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "") or ""

    @property
    def llm_configured(self) -> bool:
        return bool(self.LLM_API_KEY.strip())

    @property
    def cors_origins(self) -> list[str]:
        return _split_origins(self.ALLOWED_ORIGINS)


settings = Settings()
