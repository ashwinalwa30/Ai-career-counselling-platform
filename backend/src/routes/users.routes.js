import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';
import { toPublicUser } from '../utils/user.js';

const router = Router();
router.use(requireAuth);

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  class: z.string().trim().optional(),
  board: z.string().trim().nullable().optional(),
  schoolName: z.string().trim().nullable().optional(),
  state: z.string().trim().nullable().optional(),
  preferredLanguage: z.string().trim().optional(),
  interests: z.array(z.string().trim()).optional(),
  dob: z.string().nullable().optional(),
  subjectMarks: z.record(z.string(), z.number().min(0).max(100)).optional(),
});

function assertOwnProfile(req) {
  if (req.params.userId !== req.user.id) {
    throw httpError(403, 'You can only access your own profile.');
  }
}

router.get('/:userId/profile', asyncHandler(async (req, res) => {
  assertOwnProfile(req);
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw httpError(404, 'User not found.');
  return success(res, { profile: toPublicUser(user) }, 'Profile loaded');
}));

router.patch('/:userId/profile', asyncHandler(async (req, res) => {
  assertOwnProfile(req);
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(422, parsed.error.issues[0]?.message ?? 'Invalid profile details.');

  const updates = parsed.data;
  const data = {};

  for (const field of ['fullName', 'phone', 'board', 'schoolName', 'state', 'preferredLanguage', 'interests']) {
    if (updates[field] !== undefined) data[field] = updates[field];
  }
  if (updates.class !== undefined) data.grade = updates.class;
  if (updates.dob !== undefined) {
    if (updates.dob === null || updates.dob === '') data.dob = null;
    else {
      const date = new Date(`${updates.dob}T00:00:00.000Z`);
      if (Number.isNaN(date.getTime())) throw httpError(422, 'Please provide a valid date of birth.');
      data.dob = date;
    }
  }
  if (updates.subjectMarks !== undefined) {
    const existing = await prisma.user.findUnique({ where: { id: req.user.id }, select: { subjectMarks: true } });
    data.subjectMarks = { ...(existing?.subjectMarks ?? {}), ...updates.subjectMarks };
  }

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  return success(res, { user: toPublicUser(user) }, 'Profile updated successfully');
}));

export default router;
