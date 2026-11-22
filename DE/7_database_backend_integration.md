# Database–Backend Integration – PathFinder AI Career Counselling Platform

## Overview

The PathFinder backend is a **Node.js / Express** application that integrates with **PostgreSQL** (hosted on Neon) using the **Prisma ORM**. Every user-facing feature — authentication, test-taking, results, careers, chat — is backed by real database operations.

---

## Integration Architecture

```
┌─────────────┐        HTTPS          ┌──────────────────────────────────────┐
│   Frontend  │ ────────────────────► │   Express Backend (Node.js)          │
│  (React +   │ ◄──────────────────── │                                      │
│   Vite)     │       JSON            │  ┌─────────┐    ┌──────────────────┐ │
└─────────────┘                       │  │  Route  │───►│  Prisma Client   │ │
                                      │  │ Handlers│    │  (ORM Layer)     │ │
                                      │  └─────────┘    └────────┬─────────┘ │
                                      │                          │            │
                                      └──────────────────────────┼────────────┘
                                                                 │ SQL over TLS
                                                                 ▼
                                                    ┌────────────────────────┐
                                                    │   PostgreSQL (Neon)    │
                                                    │   Serverless Cloud DB  │
                                                    └────────────────────────┘
```

---

## 1. Database Connection

**File:** [`backend/src/db.js`](../backend/src/db.js)

```js
import { PrismaClient } from '@prisma/client';

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: { db: { url: dbUrl } },
});
```

- **Single PrismaClient instance** is shared across the entire application (singleton pattern via `globalThis`).
- In development, slow query warnings are logged.
- The connection URL points to the **Neon serverless pooler** for efficient connection management.
- SSL (`sslmode=require`) ensures all data in transit is encrypted.

---

## 2. How the Application Inserts Data

### 2a. User Registration

**Route:** `POST /api/auth/register`  
**File:** [`backend/src/routes/auth.routes.js`](../backend/src/routes/auth.routes.js)

```js
const user = await prisma.user.create({
  data: {
    fullName: data.fullName,
    email,
    passwordHash,
    phone: data.phone || null,
    grade: data.class || null,
    board: data.board || null,
    subjectMarks: data.subjectMarks ?? {},
    interests: data.interests ?? [],
    // ...
  },
});
```

➡ Inserts a row into the `User` table. Prisma validates types and enforces the unique email constraint at DB level.

### 2b. Session Creation (Login)

```js
await prisma.session.create({
  data: {
    userId,
    tokenHash: hashToken(token),   // SHA-256 of the raw token
    expiresAt,
  },
});
```

➡ Every login creates a new `Session` row. The raw token is returned to the client; only its hash is stored.

### 2c. Recording a Test Answer

```js
await tx.testAnswer.createMany({
  data: answerRows,  // array of { attemptId, questionId, selectedOption, isCorrect }
});
```

➡ Uses `createMany` for a bulk insert inside a **transaction**, ensuring all answers are saved atomically.

### 2d. Saving Chat Messages

```js
await prisma.chatMessage.createMany({
  data: [
    { userId: req.user.id, role: 'student',    content: message },
    { userId: req.user.id, role: 'counsellor', content: reply   },
  ],
});
```

➡ Both turns of the conversation are saved in a single call after the AI response is generated.

---

## 3. How the Application Retrieves Data

### 3a. Load Dashboard

**Route:** `GET /api/dashboard`

```js
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
```

➡ Four queries run in **parallel** (Promise.all), fetching the student's latest attempt, latest result, total question count, and a sample of careers.

### 3b. Career Recommendations

**Route:** `GET /api/careers/recommendations`

```js
const [careers, result] = await Promise.all([
  prisma.career.findMany(),
  prisma.testResult.findFirst({
    where: { attempt: { userId: req.user.id } },
    orderBy: { completedAt: 'desc' },
  }),
]);
```

➡ Fetches all careers and the student's RIASEC scores. Match percentages are computed server-side and returned sorted.

### 3c. Auth Middleware (Session Validation)

**File:** [`backend/src/middleware/auth.js`](../backend/src/middleware/auth.js)

```js
const session = await prisma.session.findUnique({
  where: { tokenHash: hashToken(token) },
  include: { user: true },
});
// Checks: session exists, not revoked, not expired
```

➡ Every protected API request looks up the session by token hash and joins the User in a single query.

---

## 4. How the Application Updates Data

### 4a. Update User Profile

**Route:** `PATCH /api/users/:userId/profile`

```js
const user = await prisma.user.update({
  where: { id: req.user.id },
  data: {  fullName, phone, grade, board, interests, subjectMarks },
});
```

### 4b. Mark Attempt Completed

```js
await tx.testAttempt.update({
  where: { id: attempt.id },
  data: {
    status: 'COMPLETED',
    questionsAnswered: Object.keys(normalizedAnswers).length,
    completedAt,
  },
});
```

### 4c. Upsert Test Result

```js
const savedResult = await tx.testResult.upsert({
  where:  { attemptId: attempt.id },
  update: { overallScore, sectionScores, riasecScores, ... },
  create: { attemptId: attempt.id, overallScore, sectionScores, ... },
});
```

➡ `upsert` handles both the first submission and any retakes gracefully.

---

## 5. How the Application Deletes Data

### 5a. Clear Existing Answers Before Resubmission

```js
await tx.testAnswer.deleteMany({ where: { attemptId: attempt.id } });
```

➡ Prevents duplicate answers when a student resubmits (clears old answers before inserting new ones, inside a transaction).

### 5b. Session Revocation on Logout

```js
await prisma.session.update({
  where: { id: req.sessionId },
  data: { revokedAt: new Date() },
});
```

➡ Soft delete — sets `revokedAt` rather than hard-deleting, preserving the audit trail.

### 5c. Cascading Deletes

The database schema uses `ON DELETE CASCADE` so that:
- Deleting a **User** automatically removes all their Sessions, TestAttempts, TestAnswers, TestResults and ChatMessages.
- Deleting a **TestAttempt** automatically removes its TestAnswers and TestResult.

---

## 6. Transaction Usage

The test submission is wrapped in a **Prisma transaction** to guarantee atomicity:

```js
const saved = await prisma.$transaction(async (tx) => {
  // 1. Find or create the in-progress attempt
  // 2. Clear old answers
  // 3. Bulk-insert new answers
  // 4. Mark attempt COMPLETED
  // 5. Upsert the TestResult
  return savedResult;
});
```

If any step fails, **all** changes are rolled back — the student's data is never left in an inconsistent state.

---

## 7. Backend API Endpoints and DB Operations

| Endpoint | Method | DB Operation | Tables Touched |
|---|---|---|---|
| `/api/auth/register` | POST | INSERT | User, Session |
| `/api/auth/login` | POST | SELECT + INSERT | User, Session |
| `/api/auth/logout` | POST | UPDATE | Session |
| `/api/auth/me` | GET | SELECT | Session, User |
| `/api/users/:id/profile` | GET | SELECT | User |
| `/api/users/:id/profile` | PATCH | UPDATE | User |
| `/api/test/status` | GET | SELECT | TestAttempt, TestSection, Question |
| `/api/test/questions` | GET | SELECT + INSERT | Question, TestSection, TestAttempt |
| `/api/test/submit` | POST | INSERT + UPDATE + UPSERT | TestAnswer, TestAttempt, TestResult |
| `/api/test/results` | GET | SELECT with JOIN | TestResult, TestAttempt |
| `/api/careers` | GET | SELECT | Career |
| `/api/careers/recommendations` | GET | SELECT | Career, TestResult, TestAttempt |
| `/api/careers/:id` | GET | SELECT | Career |
| `/api/chat` | POST | SELECT + INSERT | ChatMessage, TestResult, Career |
| `/api/dashboard` | GET | SELECT | TestAttempt, TestResult, Question, Career |

---

## 8. Data Flow Example: Student Takes the Test

```
Student clicks "Start Test"
        │
        ▼
GET /api/test/questions
        │
        ├─► prisma.question.findMany()         → SELECT from Question JOIN TestSection
        ├─► prisma.testAttempt.findFirst()     → SELECT from TestAttempt WHERE userId
        └─► prisma.testAttempt.create()        → INSERT into TestAttempt (if none active)
                                                  returns: questions + sections
        │
Student answers all questions and clicks "Submit"
        │
        ▼
POST /api/test/submit  { answers: { lr_01: "38", ... } }
        │
        └─► prisma.$transaction( async tx => {
                tx.testAttempt.findFirst()     → SELECT IN_PROGRESS attempt
                tx.testAnswer.deleteMany()     → DELETE old answers
                tx.testAnswer.createMany()     → INSERT 36 answers
                tx.testAttempt.update()        → UPDATE status=COMPLETED
                tx.testResult.upsert()         → INSERT/UPDATE result with scores
            })
                                                returns: { result: { overallScore, topTypes, ... } }
        │
        ▼
Frontend renders Results Page  ✅
```
