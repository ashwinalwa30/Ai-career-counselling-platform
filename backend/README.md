# PathFinder Backend — Express, Prisma and PostgreSQL

This backend is designed for the existing PathFinder React frontend. It implements the API routes documented in `frontend/API_CONTRACT.md` and returns the `{ success, data, message }` response envelope expected by the UI.

## Stack

- Node.js 20+
- Express 5
- PostgreSQL
- Prisma ORM
- bcryptjs password hashing
- Opaque random bearer tokens; only SHA-256 token hashes are stored in PostgreSQL
- Optional Gemini API integration for the AI counsellor

## 1. Create a PostgreSQL database

You can use local PostgreSQL or a hosted provider such as Neon.

For Neon, use:
- `DATABASE_URL`: pooled connection string (the hostname usually contains `-pooler`).
- `DIRECT_URL`: direct, non-pooled connection string for Prisma migrations.

Copy `.env.example` to `.env` and fill in the values. Do not commit `.env`.

```bash
cp .env.example .env
```

Example local PostgreSQL URLs:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pathfinder?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/pathfinder?schema=public"
```

## 2. Install and create the database schema

Run these commands from the `backend` directory:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

The seed script inserts:
- 5 test sections
- 36 aptitude / interest questions
- 20 career records
- A demo student account

Demo login:

```text
Email:    demo@pathfinder.in
Password: demo123
```

The demo password is hashed with bcrypt before it is stored. Change or remove the demo account before deploying a public production system.

## 3. Start the API

```bash
npm run dev
```

API base URL:

```text
http://localhost:5000/v1
```

Health check:

```text
GET http://localhost:5000/health
```

## 4. Connect the React frontend

1. Copy `frontend-integration/api.js` into the frontend project as `src/services/api.js`, replacing the mock implementation.
2. In the frontend root, create/update `.env`:

```env
VITE_API_URL=http://localhost:5000/v1
```

3. Restart the Vite dev server after changing `.env`.
4. Keep the existing `AuthContext.jsx`. The adapter uses its existing `pf-auth-token` localStorage key.
5. Run the backend and frontend in separate terminals.

The React components can continue importing the same functions from `src/services/api.js`.

## 5. Implemented routes

All routes are prefixed with `/v1`.

| Method | Route | Auth | Purpose |
|---|---|---:|---|
| POST | `/auth/register` | No | Create account and session |
| POST | `/auth/login` | No | Verify password and create session |
| POST | `/auth/forgot-password` | No | Generic password-reset acknowledgement |
| GET | `/auth/me` | Yes | Restore session |
| POST | `/auth/logout` | Yes | Revoke session |
| GET | `/users/:userId/profile` | Yes | Read own profile |
| PATCH | `/users/:userId/profile` | Yes | Update own profile |
| GET | `/dashboard` | Yes | Dashboard summary |
| GET | `/test/status` | Yes | Test status and section list |
| GET | `/test/questions` | Yes | Load questions without answer keys |
| POST | `/test/submit` | Yes | Validate, score and persist answers |
| GET | `/test/results` | Yes | Latest saved result |
| GET | `/careers?stream=Technology` | Yes | Browse / filter careers |
| GET | `/careers/recommendations` | Yes | Calculate career matches |
| GET | `/careers/:id` | Yes | Career details |
| POST | `/chat` | Yes | Gemini-powered counsellor response |

Protected endpoints require:

```http
Authorization: Bearer <token>
```

## 6. Database design

- `User`: account and profile data. `passwordHash` is never returned by the API.
- `Session`: hashed bearer tokens, expiry and revocation state.
- `TestSection`: aptitude / interest section metadata.
- `Question`: question, options and server-only correct answer / RIASEC mapping.
- `TestAttempt`: one student's test attempt and completion status.
- `TestAnswer`: selected answer for each question in an attempt.
- `TestResult`: calculated aptitude and RIASEC scores.
- `Career`: searchable career fields plus the full career detail JSON.
- `ChatMessage`: student and counsellor chat history.

## 7. Scoring logic

Scoring happens on the backend. The browser never receives `correctAnswer` or the `riasecType` mapping.

- Each aptitude section score = correct answers / total questions in that section × 100.
- Overall score = average of the four aptitude section scores.
- RIASEC scores count the selected interest option's server-side type.
- The top two RIASEC types are returned.
- Strengths and weaknesses are the two highest and two lowest aptitude sections, matching the current frontend scoring utility.
- Career match = 50% RIASEC match + 50% aptitude match, matching the current mock API formula.

## 8. Important notes before production

- The source question bank contains **36 questions**, not 40: 6 in each of four aptitude sections and 12 interest questions. The backend derives the count from the seeded database.
- Password reset currently returns the privacy-preserving generic response, but does not send an email. Add an email provider and one-time reset-token flow before enabling this feature in production.
- The chat route uses Gemini only when `GEMINI_API_KEY` is configured. Without it, the route returns HTTP 503 rather than pretending a rule-based response is AI.
- Add automated tests, logging/monitoring, backups, deployment secrets and HTTPS before public launch.
- The current frontend stores in-progress answers in localStorage. Final answers and results are persisted in PostgreSQL when the student submits. If you want cross-device test resumption, add a progress-save endpoint and call it from `TestContext`.
