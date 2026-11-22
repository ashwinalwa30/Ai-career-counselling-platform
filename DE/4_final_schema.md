# Final Database Schema – PathFinder AI Career Counselling Platform

## Technology

- **Database:** PostgreSQL (via [Neon](https://neon.tech) serverless cloud)
- **ORM:** Prisma 6.x
- **Schema file:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

---

## Schema Definition (Prisma SDL)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
}

model User {
  id                String    @id @default(cuid())
  fullName          String
  email             String    @unique
  passwordHash      String
  phone             String?
  grade             String?   @map("class")
  board             String?
  schoolName        String?
  state             String?
  preferredLanguage String    @default("English")
  interests         String[]  @default([])
  dob               DateTime? @db.Date
  subjectMarks      Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  sessions     Session[]
  testAttempts TestAttempt[]
  chatMessages ChatMessage[]

  @@index([email])
}

model Session {
  id        String    @id @default(cuid())
  tokenHash String    @unique
  userId    String
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}

model TestSection {
  id            String     @id
  label         String
  description   String
  questionCount Int
  type          String
  questions     Question[]
}

model Question {
  id            String      @id
  sectionId     String
  question      String
  options       Json
  correctAnswer String?
  difficulty    String
  section       TestSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  answers       TestAnswer[]

  @@index([sectionId])
}

model Career {
  id                String   @id
  title             String
  stream            String
  icon              String
  description       String
  riasecTypes       String[] @default([])
  requiredAptitudes String[] @default([])
  details           Json

  @@index([stream])
}

model TestAttempt {
  id                String        @id @default(cuid())
  userId            String
  status            AttemptStatus @default(IN_PROGRESS)
  questionsAnswered Int           @default(0)
  startedAt         DateTime      @default(now())
  completedAt       DateTime?
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers           TestAnswer[]
  result            TestResult?

  @@index([userId, startedAt])
}

model TestAnswer {
  id             String      @id @default(cuid())
  attemptId      String
  questionId     String
  selectedOption String
  isCorrect      Boolean?
  attempt        TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question       Question    @relation(fields: [questionId], references: [id], onDelete: Restrict)

  @@unique([attemptId, questionId])
  @@index([questionId])
}

model TestResult {
  id            String      @id @default(cuid())
  attemptId     String      @unique
  overallScore  Int
  sectionScores Json
  riasecScores  Json
  topTypes      String[]
  strengths     String[]
  weaknesses    String[]
  completedAt   DateTime    @default(now())
  attempt       TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String
  content   String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

---

## SQL Equivalent (DDL)

The following is the equivalent SQL that Prisma generates and applies via migrations:

```sql
-- Enum type
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- User table
CREATE TABLE "User" (
    "id"                TEXT         NOT NULL,
    "fullName"          TEXT         NOT NULL,
    "email"             TEXT         NOT NULL,
    "passwordHash"      TEXT         NOT NULL,
    "phone"             TEXT,
    "class"             TEXT,
    "board"             TEXT,
    "schoolName"        TEXT,
    "state"             TEXT,
    "preferredLanguage" TEXT         NOT NULL DEFAULT 'English',
    "interests"         TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "dob"               DATE,
    "subjectMarks"      JSONB,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Session table
CREATE TABLE "Session" (
    "id"        TEXT         NOT NULL,
    "tokenHash" TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fk" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "Session_tokenHash_key"   ON "Session"("tokenHash");
CREATE INDEX        "Session_userId_expiresAt" ON "Session"("userId", "expiresAt");

-- TestSection table
CREATE TABLE "TestSection" (
    "id"            TEXT    NOT NULL,
    "label"         TEXT    NOT NULL,
    "description"   TEXT    NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "type"          TEXT    NOT NULL,
    CONSTRAINT "TestSection_pkey" PRIMARY KEY ("id")
);

-- Question table
CREATE TABLE "Question" (
    "id"            TEXT NOT NULL,
    "sectionId"     TEXT NOT NULL,
    "question"      TEXT NOT NULL,
    "options"       JSONB NOT NULL,
    "correctAnswer" TEXT,
    "difficulty"    TEXT NOT NULL,
    CONSTRAINT "Question_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "Question_sectionId" FOREIGN KEY ("sectionId")
        REFERENCES "TestSection"("id") ON DELETE CASCADE
);
CREATE INDEX "Question_sectionId_idx" ON "Question"("sectionId");

-- Career table
CREATE TABLE "Career" (
    "id"                TEXT     NOT NULL,
    "title"             TEXT     NOT NULL,
    "stream"            TEXT     NOT NULL,
    "icon"              TEXT     NOT NULL,
    "description"       TEXT     NOT NULL,
    "riasecTypes"       TEXT[]   NOT NULL DEFAULT ARRAY[]::TEXT[],
    "requiredAptitudes" TEXT[]   NOT NULL DEFAULT ARRAY[]::TEXT[],
    "details"           JSONB    NOT NULL,
    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Career_stream_idx" ON "Career"("stream");

-- TestAttempt table
CREATE TABLE "TestAttempt" (
    "id"                TEXT            NOT NULL,
    "userId"            TEXT            NOT NULL,
    "status"            "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "questionsAnswered" INTEGER         NOT NULL DEFAULT 0,
    "startedAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"       TIMESTAMP(3),
    CONSTRAINT "TestAttempt_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "TestAttempt_userId" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "TestAttempt_userId_startedAt" ON "TestAttempt"("userId", "startedAt");

-- TestAnswer table
CREATE TABLE "TestAnswer" (
    "id"             TEXT    NOT NULL,
    "attemptId"      TEXT    NOT NULL,
    "questionId"     TEXT    NOT NULL,
    "selectedOption" TEXT    NOT NULL,
    "isCorrect"      BOOLEAN,
    CONSTRAINT "TestAnswer_pkey"       PRIMARY KEY ("id"),
    CONSTRAINT "TestAnswer_attemptId"  FOREIGN KEY ("attemptId")
        REFERENCES "TestAttempt"("id") ON DELETE CASCADE,
    CONSTRAINT "TestAnswer_questionId" FOREIGN KEY ("questionId")
        REFERENCES "Question"("id") ON DELETE RESTRICT,
    CONSTRAINT "TestAnswer_unique"     UNIQUE ("attemptId", "questionId")
);
CREATE INDEX "TestAnswer_questionId_idx" ON "TestAnswer"("questionId");

-- TestResult table
CREATE TABLE "TestResult" (
    "id"            TEXT         NOT NULL,
    "attemptId"     TEXT         NOT NULL,
    "overallScore"  INTEGER      NOT NULL,
    "sectionScores" JSONB        NOT NULL,
    "riasecScores"  JSONB        NOT NULL,
    "topTypes"      TEXT[]       NOT NULL,
    "strengths"     TEXT[]       NOT NULL,
    "weaknesses"    TEXT[]       NOT NULL,
    "completedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "TestResult_attemptId" FOREIGN KEY ("attemptId")
        REFERENCES "TestAttempt"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "TestResult_attemptId_key" ON "TestResult"("attemptId");

-- ChatMessage table
CREATE TABLE "ChatMessage" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "role"      TEXT         NOT NULL,
    "content"   TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey"   PRIMARY KEY ("id"),
    CONSTRAINT "ChatMessage_userId" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "ChatMessage_userId_createdAt" ON "ChatMessage"("userId", "createdAt");
```

---

## Indexes Summary

| Table | Index | Columns | Purpose |
|---|---|---|---|
| User | `User_email_key` | email | Unique constraint + fast login lookup |
| Session | `Session_tokenHash_key` | tokenHash | Unique; auth token verification O(1) |
| Session | `Session_userId_expiresAt` | userId, expiresAt | Efficiently query active sessions |
| Question | `Question_sectionId_idx` | sectionId | Load all questions of a section |
| Career | `Career_stream_idx` | stream | Filter careers by stream |
| TestAttempt | `TestAttempt_userId_startedAt` | userId, startedAt | Find latest attempt per user |
| TestAnswer | `TestAnswer_questionId_idx` | questionId | Join from Question side |
| TestAnswer | `TestAnswer_unique` | attemptId, questionId | Prevent duplicate answers |
| TestResult | `TestResult_attemptId_key` | attemptId | One-to-one guarantee |
| ChatMessage | `ChatMessage_userId_createdAt` | userId, createdAt | Paginate chat history |

---

## Constraints Summary

| Constraint Type | Tables | Detail |
|---|---|---|
| PRIMARY KEY | All tables | CUID strings as surrogate keys |
| UNIQUE | User.email, Session.tokenHash, TestAnswer(attemptId,questionId), TestResult.attemptId | Business logic uniqueness |
| FOREIGN KEY (CASCADE) | Session, TestAttempt, TestAnswer, TestResult, ChatMessage | Cascading deletes on user/attempt removal |
| FOREIGN KEY (RESTRICT) | TestAnswer.questionId | Prevent orphan answers if question removed |
| NOT NULL | Core fields in all tables | Enforced at DB level |
| DEFAULT | Various | 'English', now(), [], 0, 'IN_PROGRESS' |
| CHECK (via Enum) | TestAttempt.status | Only IN_PROGRESS or COMPLETED |
