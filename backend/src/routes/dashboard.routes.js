import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, success } from '../utils/http.js';
import seedData from '../../prisma/seed-data.json' with { type: 'json' };

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const [latestAttempt, latestResult, totalQuestions, careers] = await Promise.all([
    prisma.testAttempt.findFirst({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.testResult.findFirst({
      where: { attempt: { userId: req.user.id } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.question.count(),
    prisma.career.findMany({ take: 6, orderBy: { title: 'asc' } }),
  ]);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const fact = seedData.careerFacts[dayOfYear % seedData.careerFacts.length];

  const status = latestAttempt?.status === 'COMPLETED'
    ? 'completed'
    : latestAttempt?.status === 'IN_PROGRESS'
      ? 'in_progress'
      : 'not_started';

  const dailyFact = {
    fact: fact.fact,
    source: 'PathFinder career guidance',
  };

  return success(res, {
    profileCompletion: {
      percentage: 0,
      items: [],
    },
    testStatus: {
      status,
      questionsAnswered: latestAttempt?.questionsAnswered ?? 0,
      totalQuestions,
      overallScore: latestResult?.overallScore ?? null,
      completedAt: latestAttempt?.completedAt?.toISOString() ?? null,
    },
    careerMatches: careers.map((career) => ({
      ...career.details,
      matchPct: null,
    })),
    nextSteps: seedData.nextSteps,
    dailyFact,
  }, 'Dashboard data loaded');
}));

export default router;
