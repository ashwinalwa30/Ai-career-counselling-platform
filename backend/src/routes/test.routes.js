import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';
import { calculateTestResult } from '../utils/scoring.js';
import { toPublicResult } from '../utils/user.js';
import seedData from '../../prisma/seed-data.json' with { type: 'json' };

const router = Router();
router.use(requireAuth);

router.get('/status', asyncHandler(async (req, res) => {
  const [latestAttempt, dbSections, totalQuestions] = await Promise.all([
    prisma.testAttempt.findFirst({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
    }),
    prisma.testSection.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, label: true, description: true, questionCount: true, type: true },
    }),
    prisma.question.count(),
  ]);

  const sectionMap = new Map(dbSections.map((section) => [section.id, section]));
  const sections = seedData.sections.map((section) => sectionMap.get(section.id)).filter(Boolean);

  const status = latestAttempt?.status === 'COMPLETED'
    ? 'completed'
    : latestAttempt?.status === 'IN_PROGRESS'
      ? 'in_progress'
      : 'not_started';

  return success(res, {
    testStatus: {
      status,
      questionsAnswered: latestAttempt?.questionsAnswered ?? 0,
      totalQuestions,
      completedAt: latestAttempt?.completedAt?.toISOString() ?? null,
    },
    sections,
  }, 'Test status loaded');
}));

router.get('/questions', asyncHandler(async (req, res) => {
  const dbQuestions = await prisma.question.findMany({ include: { section: true } });
  const questionMap = new Map(dbQuestions.map((question) => [question.id, question]));
  const questions = seedData.questions.map((question) => questionMap.get(question.id)).filter(Boolean);
  const dbSections = await prisma.testSection.findMany();
  const sectionMap = new Map(dbSections.map((section) => [section.id, section]));
  const sections = seedData.sections.map((section) => sectionMap.get(section.id)).filter(Boolean);

  // Opening the test creates a resumable attempt. Repeated page loads reuse it.
  const activeAttempt = await prisma.testAttempt.findFirst({
    where: { userId: req.user.id, status: 'IN_PROGRESS' },
    orderBy: { startedAt: 'desc' },
  });
  if (!activeAttempt) {
    await prisma.testAttempt.create({ data: { userId: req.user.id } });
  }

  // Never send correct answers or RIASEC scoring keys to the browser.
  const safeQuestions = questions.map((question) => ({
    id: question.id,
    section: question.sectionId,
    question: question.question,
    options: Array.isArray(question.options)
      ? question.options.map((option) =>
          typeof option === 'object' && option !== null ? { text: option.text } : option,
        )
      : [],
    difficulty: question.difficulty,
  }));

  return success(res, { questions: safeQuestions, sections }, 'Questions loaded');
}));

router.post('/submit', asyncHandler(async (req, res) => {
  const answers = req.body?.answers;
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw httpError(422, 'answers must be an object of questionId to selected option.');
  }

  const questions = await prisma.question.findMany({ orderBy: { id: 'asc' } });
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const normalizedAnswers = {};

  for (const [questionId, selectedOption] of Object.entries(answers)) {
    if (selectedOption === null || selectedOption === undefined || selectedOption === '') continue;
    const question = questionMap.get(questionId);
    if (!question) throw httpError(422, `Unknown question: ${questionId}`);

    const validOption = Array.isArray(question.options) && question.options.some((option) => {
      const optionText = typeof option === 'string' ? option : option?.text;
      return optionText === selectedOption;
    });
    if (!validOption) throw httpError(422, `Invalid answer for question ${questionId}.`);
    normalizedAnswers[questionId] = selectedOption;
  }

  const result = calculateTestResult(normalizedAnswers, questions);
  const completedAt = new Date();

  const saved = await prisma.$transaction(async (tx) => {
    let attempt = await tx.testAttempt.findFirst({
      where: { userId: req.user.id, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
    });

    if (!attempt) {
      attempt = await tx.testAttempt.create({ data: { userId: req.user.id } });
    }

    await tx.testAnswer.deleteMany({ where: { attemptId: attempt.id } });

    const answerRows = Object.entries(normalizedAnswers).map(([questionId, selectedOption]) => {
      const question = questionMap.get(questionId);
      return {
        attemptId: attempt.id,
        questionId,
        selectedOption,
        isCorrect: question.sectionId === 'interest_profile'
          ? null
          : question.correctAnswer === selectedOption,
      };
    });

    if (answerRows.length) {
      await tx.testAnswer.createMany({ data: answerRows });
    }

    await tx.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        questionsAnswered: Object.keys(normalizedAnswers).length,
        completedAt,
      },
    });

    const savedResult = await tx.testResult.upsert({
      where: { attemptId: attempt.id },
      update: {
        overallScore: result.overallScore,
        sectionScores: result.sectionScores,
        riasecScores: result.riasecScores,
        topTypes: result.topTypes,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        completedAt,
      },
      create: {
        attemptId: attempt.id,
        overallScore: result.overallScore,
        sectionScores: result.sectionScores,
        riasecScores: result.riasecScores,
        topTypes: result.topTypes,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        completedAt,
      },
    });

    return savedResult;
  });

  return success(res, { result: toPublicResult(saved) }, 'Test submitted successfully');
}));

router.get('/results', asyncHandler(async (req, res) => {
  const result = await prisma.testResult.findFirst({
    where: { attempt: { userId: req.user.id } },
    orderBy: { completedAt: 'desc' },
  });
  return success(
    res,
    { result: toPublicResult(result) },
    result ? 'Results loaded' : 'No test taken yet',
  );
}));

export default router;
