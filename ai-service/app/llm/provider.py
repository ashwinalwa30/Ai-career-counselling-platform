"""LLM Provider interface and factory.

Provides a unified interface for calling LLM backends with strict privacy,
timeout enforcement, and retry semantics. Never logs keys, message bodies,
or student details.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger("ai_service.llm")


class LLMProvider(ABC):
    """Abstract base provider for LLM completion calls."""

    @abstractmethod
    def generate(
        self,
        system: str,
        messages: list[dict[str, str]],
        timeout: float = 15.0,
    ) -> str:
        """Generate a response text given system instructions and conversational turns.

        Args:
            system: The system instruction string.
            messages: List of turns formatted as [{'role': 'user'|'assistant', 'content': str}].
            timeout: Maximum seconds to wait before timing out (default 15.0).

        Returns:
            The raw text response from the model.

        Raises:
            TimeoutError: If the call exceeds the timeout.
            Exception: On fatal network or provider errors after retry.
        """
        pass


class NullProvider(LLMProvider):
    """Fallback provider used when no API key is configured or offline mode is forced."""

    def generate(
        self,
        system: str,
        messages: list[dict[str, str]],
        timeout: float = 15.0,
    ) -> str:
        logger.info("NullProvider invoked; returning empty response (offline mode)")
        return ""


def get_llm_provider() -> LLMProvider:
    """Return the configured LLM provider instance.

    Adding another provider is a single-file change:
    implement LLMProvider, import here, and branch on settings.LLM_PROVIDER.
    """
    from app.config import settings

    if not settings.llm_configured:
        return NullProvider()

    # Default provider is GeminiProvider
    from app.llm.gemini import GeminiProvider

    return GeminiProvider(
        api_key=settings.LLM_API_KEY,
        model=settings.LLM_MODEL,
    )
