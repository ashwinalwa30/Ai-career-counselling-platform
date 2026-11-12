import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth, hashToken } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';
import { toPublicUser } from '../utils/user.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(100),
  phone: z.string().trim().optional().or(z.literal('')),
  class: z.string().trim().optional(),
  board: z.string().trim().optional(),
  schoolName: z.string().trim().optional(),
  state: z.string().trim().optional(),
  preferredLanguage: z.string().trim().optional(),
  interests: z.array(z.string().trim().min(1)).optional(),
  dob: z.string().optional().or(z.literal('')),
  subjectMarks: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const days = Number(process.env.SESSION_DAYS || 30);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return token;
}

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(422, parsed.error.issues[0]?.message ?? 'Invalid login details.');

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user
    ? await bcrypt.compare(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    throw httpError(401, 'Incorrect email or password. Please check and try again.');
  }

  const token = await createSession(user.id, res);
  return success(res, { user: toPublicUser(user), token }, 'Logged in successfully');
}));

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(422, parsed.error.issues[0]?.message ?? 'Invalid registration details.');

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw httpError(409, 'An account with this email already exists. Try logging in.');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  let dob = null;
  if (data.dob) {
    dob = new Date(`${data.dob}T00:00:00.000Z`);
    if (Number.isNaN(dob.getTime())) throw httpError(422, 'Please provide a valid date of birth.');
  }

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      email,
      passwordHash,
      phone: data.phone || null,
      grade: data.class || null,
      board: data.board || null,
      schoolName: data.schoolName || null,
      state: data.state || null,
      preferredLanguage: data.preferredLanguage || 'English',
      interests: data.interests ?? [],
      dob,
      subjectMarks: data.subjectMarks ?? {},
    },
  });

  const token = await createSession(user.id, res);
  return success(res, { user: toPublicUser(user), token }, 'Account created successfully', 201);
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  // Keep the response identical for registered and unregistered emails.
  // Connect an email provider and a one-time reset-token flow before production use.
  return success(res, null, 'If that email is registered, a reset link has been sent.');
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  return success(res, { user: toPublicUser(req.user) }, 'Session restored');
}));

router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
  await prisma.session.update({
    where: { id: req.sessionId },
    data: { revokedAt: new Date() },
  });
  return success(res, null, 'Logged out successfully');
}));

export default router;
