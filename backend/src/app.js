import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import testRoutes from './routes/test.routes.js';
import careersRoutes from './routes/careers.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('This origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'PathFinder API is running' });
});

const limiterHandler = (req, res) => res.status(429).json({ success: false, data: null, message: 'Too many requests. Please wait a moment.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, handler: limiterHandler });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, handler: limiterHandler });

app.use('/v1/auth', authLimiter, authRoutes);
app.use('/v1/users', usersRoutes);
app.use('/v1/dashboard', dashboardRoutes);
app.use('/v1/test', testRoutes);
app.use('/v1/careers', careersRoutes);
app.use('/v1/chat', chatLimiter, chatRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, data: null, message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      data: null,
      message: error.issues[0]?.message ?? 'Invalid request data.',
    });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({ success: false, data: null, message: 'A record with this value already exists.' });
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    success: false,
    data: null,
    message: status >= 500 ? 'Something went wrong on the server.' : error.message,
  });
});

export default app;
