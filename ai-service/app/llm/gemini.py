"""Gemini LLM Provider implementation.

Calls Google Generative Language API via httpx with a 15-second timeout,
one retry on network error, and privacy-preserving logging.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.llm.provider import LLMProvider

logger = logging.getLogger("ai_service.llm.gemini")


class GeminiProvider(LLMProvider):
    """Google Gemini LLM provider implementation."""

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    def generate(
        self,
        system: str,
        messages: list[dict[str, str]],
        timeout: float = 15.0,
    ) -> str:
        """Call Gemini generateContent API with systemInstruction and conversation turns."""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent"
            f"?key={self._api_key}"
        )

        # Map turns to Gemini content structure ('user' -> 'user', 'assistant' -> 'model')
        contents: list[dict[str, Any]] = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            content = m.get("content", "")
            contents.append({"role": role, "parts": [{"text": content}]})

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 600,
            },
        }

        if system:
            payload["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        prompt_chars = sum(len(m.get("content", "")) for m in messages)
        logger.info(
            "Calling Gemini provider: model=%s turns=%d total_chars=%d timeout=%.1fs",
            self._model,
            len(messages),
            prompt_chars,
            timeout,
        )

        last_error: Exception | None = None
        # Up to 2 attempts (1 initial + 1 retry on network error)
        for attempt in range(2):
            try:
                with httpx.Client(timeout=timeout) as client:
                    resp = client.post(url, json=payload)
                    logger.info("Gemini HTTP status=%d (attempt %d)", resp.status_code, attempt + 1)

                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = str(parts[0].get("text", "")).strip()
                                logger.info("Gemini response received: chars=%d", len(text))
                                return text
                        return ""
                    else:
                        logger.warning(
                            "Gemini returned non-200 status=%d attempt=%d",
                            resp.status_code,
                            attempt + 1,
                        )
                        resp.raise_for_status()
            except httpx.TimeoutException as exc:
                logger.warning("Gemini request timed out after %.1fs (attempt %d)", timeout, attempt + 1)
                last_error = exc
                break  # Do not retry on timeout
            except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                logger.warning("Gemini network/HTTP error on attempt %d: %s", attempt + 1, type(exc).__name__)
                last_error = exc
                if attempt == 0:
                    continue  # Retry once on network error
                break

        if last_error:
            raise last_error

        return ""
