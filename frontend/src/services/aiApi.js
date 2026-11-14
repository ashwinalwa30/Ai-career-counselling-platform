/**
 * aiApi.js — PathFinder AI Service Client
 *
 * Thin wrapper around the FastAPI ai-service (http://localhost:8000).
 * Every function falls back gracefully to the mock api.js when the
 * ai-service is unreachable, so the frontend keeps working during dev
 * even when the Python server is not running.
 *
 * Response envelope from ai-service: { success, data, message }
 * This module unwraps .data before returning so callers get the payload directly.
 */

import { sendChatMessage as mockSendChat } from './api';

const AI_BASE_URL = 'http://localhost:8000';
const TIMEOUT_MS = 8000;

// ─── Low-level helper ────────────────────────────────────────────────────────

/**
 * POST to the ai-service. Returns the unwrapped `data` payload.
 * Throws if the service is unreachable or returns success:false.
 */
async function aiPost(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${AI_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`ai-service ${path} returned HTTP ${res.status}`);
    }

    const envelope = await res.json();
    if (!envelope.success) {
      throw new Error(envelope.message || `ai-service ${path} returned success:false`);
    }
    return envelope.data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * POST /ai/assess
 *
 * @param {{ answers: Record<string,string|null>, profile?: object, language?: 'en'|'hi' }} payload
 * @returns {Promise<AssessResult>}  overallScore, sectionScores, riasecScores, …
 */
export async function assessStudent(payload) {
  return aiPost('/ai/assess', {
    answers: payload.answers,
    profile: payload.profile ?? null,
    language: payload.language ?? 'en',
  });
}

/**
 * POST /ai/recommendations
 *
 * @param {{ result: AssessResult, profile?: object, language?: 'en'|'hi' }} payload
 * @returns {Promise<{ careers: CareerMatch[], topPicks: string[], hasResults: boolean }>}
 */
export async function getRecommendations(payload) {
  return aiPost('/ai/recommendations', {
    result: payload.result,
    profile: payload.profile ?? null,
    language: payload.language ?? 'en',
  });
}

/**
 * POST /ai/explain
 *
 * @param {{ careerId: string, result: AssessResult, profile?: object,
 *            match?: CareerMatch, topPicks?: string[], language?: 'en'|'hi', polish?: boolean }} payload
 * @returns {Promise<ExplainResponse>}  headline, whyItFits, watchOuts, whatWouldChange, …
 */
export async function explainCareer(payload) {
  return aiPost('/ai/explain', {
    careerId: payload.careerId,
    result: payload.result,
    profile: payload.profile ?? null,
    match: payload.match ?? null,
    topPicks: payload.topPicks ?? null,
    language: payload.language ?? 'en',
    polish: payload.polish ?? false,
  });
}

/**
 * POST /ai/roadmap
 *
 * @param {{ careerId: string, profile: object, result: AssessResult,
 *            language?: 'en'|'hi', polish?: boolean }} payload
 * @returns {Promise<RoadmapResponse>}  steps, focusAreas, streamAdvice, examPlan, backupPaths, …
 */
export async function getPersonalisedRoadmap(payload) {
  return aiPost('/ai/roadmap', {
    careerId: payload.careerId,
    profile: payload.profile,
    result: payload.result,
    language: payload.language ?? 'en',
    polish: payload.polish ?? false,
  });
}

/**
 * POST /ai/chat — with fallback to mock api.js when ai-service is down.
 *
 * @param {{ message: string, history?: ChatTurn[], context?: object, language?: 'en'|'hi' }} payload
 * @returns {Promise<{ reply: string, source: 'rules'|'llm'|'fallback' }>}
 */
export async function sendAIChat(payload) {
  try {
    return await aiPost('/ai/chat', {
      message: payload.message,
      history: payload.history ?? [],
      context: payload.context ?? null,
      language: payload.language ?? 'en',
    });
  } catch (_err) {
    // Fallback: delegate to the existing mock / backend handler in api.js
    try {
      const fallback = await mockSendChat(payload.message, payload.context);
      const reply =
        typeof fallback === 'string'
          ? fallback
          : fallback?.data?.reply ?? fallback?.reply ?? 'Sorry, I am unable to reach the counsellor right now. Please try again later.';
      return { reply, source: 'fallback' };
    } catch (_e) {
      return {
        reply: 'Sorry, I am unable to reach the counsellor right now. Please try again later.',
        source: 'fallback',
      };
    }
  }
}

/**
 * Quick connectivity check — resolves true if ai-service /health responds OK.
 * Never throws; returns false on any error.
 */
export async function isAIServiceAvailable() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${AI_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch (_) {
    return false;
  }
}

