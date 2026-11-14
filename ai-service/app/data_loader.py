"""Load career and question JSON once. correctAnswer stays in this process."""

from __future__ import annotations

import json
from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_careers: list[dict] | None = None
_questions: list[dict] | None = None


def load_data() -> None:
    """Read both JSON files. Safe to call again; replaces the in-memory copies."""
    global _careers, _questions
    careers = _read_array(_DATA_DIR / "careers.json")
    questions = _read_array(_DATA_DIR / "questions.json")
    _careers = careers
    _questions = questions


def get_careers() -> list[dict]:
    if _careers is None:
        load_data()
    return _careers  # type: ignore[return-value]


def get_questions() -> list[dict]:
    if _questions is None:
        load_data()
    return _questions  # type: ignore[return-value]


def _read_array(path: Path) -> list[dict]:
    if not path.is_file():
        raise FileNotFoundError(f"Missing data file: {path.name}. Run scripts/export_data.mjs.")
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, list):
        raise ValueError(f"{path.name} must be a JSON array")
    return payload
