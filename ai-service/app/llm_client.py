"""Lightweight, resilient LLM client abstraction.

Supports Google Gemini and OpenAI-compatible providers.
Strict 5-second timeout, zero external network calls when LLM_API_KEY is unset,
and guaranteed fallback to None on any error or timeout.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def generate_completion(
    prompt: str,
    system_prompt: str | None = None,
    max_tokens: int = 600,
    temperature: float = 0.3,
) -> str | None:
    """Generate text completion from configured LLM provider.

    Returns None if no LLM is configured, or if any network error or timeout occurs.
    """
    if not settings.llm_configured:
        return None

    provider = (settings.LLM_PROVIDER or "").lower().strip()
    model = (settings.LLM_MODEL or "").strip()
    api_key = settings.LLM_API_KEY.strip()

    # Default to Gemini if provider mentions google/gemini or model mentions gemini
    is_gemini = "gemini" in provider or "google" in provider or "gemini" in model.lower()

    try:
        if is_gemini or not provider:
            return _call_gemini(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model or "gemini-1.5-flash",
                api_key=api_key,
                max_tokens=max_tokens,
                temperature=temperature,
            )
        else:
            return _call_openai_compatible(
                prompt=prompt,
                system_prompt=system_prompt,
                model=model or "gpt-4o-mini",
                api_key=api_key,
                max_tokens=max_tokens,
                temperature=temperature,
            )
    except Exception as exc:
        logger.warning("LLM generation failed, falling back to rule-based engine: %s", exc)
        return None


def _call_gemini(
    prompt: str,
    system_prompt: str | None,
    model: str,
    api_key: str,
    max_tokens: int,
    temperature: float,
) -> str | None:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    payload: dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    if system_prompt:
        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

    with httpx.Client(timeout=5.0) as client:
        resp = client.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return str(parts[0].get("text", "")).strip()
    return None


def _call_openai_compatible(
    prompt: str,
    system_prompt: str | None,
    model: str,
    api_key: str,
    max_tokens: int,
    temperature: float,
) -> str | None:
    url = "https://api.openai.com/v1/chat/completions"
    messages: list[dict[str, str]] = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    with httpx.Client(timeout=5.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                return str(choices[0].get("message", {}).get("content", "")).strip()
    return None

