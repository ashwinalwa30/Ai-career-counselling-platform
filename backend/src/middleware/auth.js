import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { httpError } from '../utils/http.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw httpError(401, 'Session expired. Please log in again.');
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw httpError(401, 'Session expired. Please log in again.');
    }

    req.user = session.user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}
