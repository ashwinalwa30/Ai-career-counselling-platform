import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

function withMatch(career, matchPct = null) {
  return { ...career.details, matchPct };
}

router.get('/', asyncHandler(async (req, res) => {
  const where = req.query.stream ? { stream: String(req.query.stream) } : {};
  const careers = await prisma.career.findMany({ where, orderBy: { title: 'asc' } });
  return success(res, { careers: careers.map((career) => career.details) }, 'Careers loaded');
}));

router.get('/recommendations', asyncHandler(async (req, res) => {
  const [careers, result] = await Promise.all([
    prisma.career.findMany(),
    prisma.testResult.findFirst({
      where: { attempt: { userId: req.user.id } },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  if (!result) {
    return success(
      res,
      { careers: careers.map((career) => withMatch(career)), hasResults: false },
      'No test results — showing all careers',
    );
  }

  const sectionScores = result.sectionScores;
  const riasecScores = result.riasecScores;

  const recommended = careers.map((career) => {
    const riasecPoints = career.riasecTypes.reduce(
      (sum, type) => sum + (riasecScores[type] ?? 0),
      0,
    );
    const riasecMatch = Math.min(100, Math.round((riasecPoints / 12) * 100));
    const aptitudeMatch = career.requiredAptitudes.length
      ? Math.round(
          career.requiredAptitudes.reduce(
            (sum, section) => sum + (sectionScores[section] ?? 0),
            0,
          ) / career.requiredAptitudes.length,
        )
      : 50;
    const matchPct = Math.round(0.5 * riasecMatch + 0.5 * aptitudeMatch);
    return withMatch(career, matchPct);
  }).sort((a, b) => b.matchPct - a.matchPct);

  return success(res, { careers: recommended, hasResults: true }, 'Recommendations calculated');
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const career = await prisma.career.findUnique({ where: { id: req.params.id } });
  if (!career) throw httpError(404, `Career "${req.params.id}" not found.`);
  return success(res, { career: career.details }, 'Career loaded');
}));

export default router;
