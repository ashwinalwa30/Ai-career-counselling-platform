import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

router.post('/', asyncHandler(async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) throw httpError(422, 'message is required');
  if (message.length > 4000) throw httpError(422, 'message must be 4000 characters or fewer');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw httpError(503, 'AI service unavailable. Add GEMINI_API_KEY to the backend .env file.');
  }

  const [latestResult, careers] = await Promise.all([
    prisma.testResult.findFirst({
      where: { attempt: { userId: req.user.id } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.career.findMany(),
  ]);

  let topCareers = [];
  if (latestResult) {
    const sectionScores = latestResult.sectionScores;
    const riasecScores = latestResult.riasecScores;
    topCareers = careers.map((career) => {
      const riasecPoints = career.riasecTypes.reduce((sum, type) => sum + (riasecScores[type] ?? 0), 0);
      const riasecMatch = Math.min(100, Math.round((riasecPoints / 12) * 100));
      const aptitudeMatch = career.requiredAptitudes.length
        ? Math.round(career.requiredAptitudes.reduce((sum, section) => sum + (sectionScores[section] ?? 0), 0) / career.requiredAptitudes.length)
        : 50;
      return {
        title: career.title,
        matchPct: Math.round(0.5 * riasecMatch + 0.5 * aptitudeMatch),
      };
    }).sort((a, b) => b.matchPct - a.matchPct).slice(0, 3);
  }

  const context = latestResult
    ? `Student test score: ${latestResult.overallScore}/100. RIASEC profile: ${JSON.stringify(latestResult.riasecScores)}. Section scores: ${JSON.stringify(latestResult.sectionScores)}. Top career matches: ${topCareers.map((career) => `${career.title} (${career.matchPct}%)`).join(', ')}.`
    : 'The student has not completed the aptitude test yet. Give general career guidance and suggest taking the test for personalised recommendations.';

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let aiResponse;
  try {
    aiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: 'You are PathFinder, a supportive career counsellor for Indian school students in classes 8–12. Give practical, age-appropriate, balanced guidance. Do not guarantee salaries, admissions, or outcomes. Ask a follow-up question when useful. Use the student context only to personalise advice.' }],
        },
        contents: [{
          role: 'user',
          parts: [{ text: `${context}\n\nStudent question: ${message}` }],
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
      }),
    });
  } catch {
    throw httpError(503, 'AI service unavailable. Please try again shortly.');
  }

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('Gemini request failed:', aiResponse.status, errorText.slice(0, 500));
    throw httpError(503, 'AI service unavailable. Please try again shortly.');
  }

  const payload = await aiResponse.json();
  const reply = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('\n')
    .trim();

  if (!reply) throw httpError(503, 'AI service unavailable. Please try again shortly.');

  await prisma.chatMessage.createMany({
    data: [
      { userId: req.user.id, role: 'student', content: message },
      { userId: req.user.id, role: 'counsellor', content: reply },
    ],
  });

  return success(res, { reply }, 'Reply generated');
}));

export default router;
