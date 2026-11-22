# Database Normalization – PathFinder AI Career Counselling Platform

## Overview

This document demonstrates normalization of the PathFinder database up to **Third Normal Form (3NF)**. We start from a hypothetical flat (unnormalized) table representing all data stored during a test submission and show how it is progressively transformed.

---

## Unnormalized Form (UNF)

Imagine storing everything in one flat table:

```
StudentTestRecord(
  studentId, studentName, studentEmail, studentPhone, schoolName, board, state,
  attemptId, attemptStatus, attemptStartedAt, attemptCompletedAt,
  sectionId, sectionLabel, sectionType,
  questionId, questionText, questionOptions, questionCorrectAnswer, questionDifficulty,
  selectedOption, isCorrect,
  overallScore, sectionScores, riasecScores, topTypes,
  careerTitle, careerStream, careerDescription,
  chatMessage, chatRole, chatTimestamp
)
```

**Problems:**
- Repeating groups (multiple questions, multiple answers, multiple chat messages per row)
- Massive data redundancy (student details repeated for every question)
- Update, insertion and deletion anomalies

---

## First Normal Form (1NF)

**Rule:** Eliminate repeating groups; ensure each column contains atomic values; every row is unique.

**Transformations applied:**
1. Separated multi-valued columns (`questionOptions` stored as JSON/separate rows, not comma-separated strings).
2. Each row now represents a single fact: one answer to one question by one user in one attempt.
3. Added a composite or surrogate primary key where needed.

**Tables after 1NF:**

```
StudentTestRecord_1NF(
  studentId, studentName, studentEmail, studentPhone, schoolName, board, state,
  attemptId, attemptStatus, attemptStartedAt, attemptCompletedAt,
  overallScore, sectionScores, riasecScores, topTypes,
  sectionId, sectionLabel, sectionType,
  questionId, questionText, questionOption1, questionOption2,
                questionOption3, questionOption4,
  questionCorrectAnswer, questionDifficulty,
  selectedOption, isCorrect
)
PK: (attemptId, questionId)
```

**Progress:** No repeating groups. Each cell is atomic. ✅

---

## Second Normal Form (2NF)

**Rule:** Must be in 1NF. Every non-key attribute must be **fully functionally dependent** on the entire primary key (no partial dependencies).

The composite key is `(attemptId, questionId)`.

**Partial Dependencies Identified:**

| Attribute | Depends on | Type |
|---|---|---|
| studentName, studentEmail, studentPhone | studentId only | Partial |
| schoolName, board, state | studentId only | Partial |
| attemptStatus, attemptStartedAt | attemptId only | Partial |
| overallScore, sectionScores, topTypes | attemptId only | Partial |
| sectionLabel, sectionType | sectionId only | Partial |
| questionText, questionOptions | questionId only | Partial |
| questionCorrectAnswer, difficulty | questionId only | Partial |
| selectedOption, isCorrect | (attemptId, questionId) | Full ✅ |

**Transformations applied:** Remove all partial dependencies into separate tables.

**Tables after 2NF:**

```
User(studentId PK, studentName, studentEmail, studentPhone, schoolName, board, state)

TestAttempt(attemptId PK, studentId FK→User, attemptStatus, attemptStartedAt, attemptCompletedAt)

TestResult(resultId PK, attemptId FK→TestAttempt, overallScore, sectionScores, riasecScores, topTypes)

TestSection(sectionId PK, sectionLabel, sectionType, questionCount)

Question(questionId PK, sectionId FK→TestSection, questionText, option1, option2, option3, option4, correctAnswer, difficulty)

TestAnswer(answerId PK, attemptId FK→TestAttempt, questionId FK→Question, selectedOption, isCorrect)
```

**Progress:** No partial dependencies remain. ✅

---

## Third Normal Form (3NF)

**Rule:** Must be in 2NF. No **transitive dependencies** — non-key attributes must not depend on other non-key attributes.

**Transitive Dependencies Identified:**

| In Table | Attribute A → Attribute B | Issue |
|---|---|---|
| User | grade → board | No — grade and board are independent |
| TestAnswer | isCorrect depends on (selectedOption, questionId, correctAnswer) | Computed, not a transitive dep. in storage terms ✅ |
| TestResult | resultId → topTypes (derived from riasecScores) | Stored as denormalized but stable; acceptable ✅ |

After careful analysis, our 2NF schema has **no true transitive dependencies** — all non-key columns depend directly on the primary key of their table.

**Additional 3NF Refinements Applied:**

1. **ChatMessage** — extracted into its own table (was not in the flat record at all).
2. **Career** — extracted into its own table with no dependency on any user or test data.
3. **Session** — extracted separately; tokenHash is functionally dependent only on sessionId.
4. **subjectMarks** — stored as JSONB (a flexible map) to avoid creating a separate table with hundreds of nullable subject columns.

**Final 3NF Schema:**

```
User(id PK, fullName, email UNIQUE, passwordHash, phone, grade, board, schoolName,
     state, preferredLanguage, interests[], dob, subjectMarks JSON, createdAt, updatedAt)

Session(id PK, tokenHash UNIQUE, userId FK→User, expiresAt, revokedAt, createdAt)

TestSection(id PK, label, description, questionCount, type)

Question(id PK, sectionId FK→TestSection, question, options JSON, correctAnswer, difficulty)

Career(id PK, title, stream, icon, description, riasecTypes[], requiredAptitudes[], details JSON)

TestAttempt(id PK, userId FK→User, status ENUM, questionsAnswered, startedAt, completedAt)

TestAnswer(id PK, attemptId FK→TestAttempt, questionId FK→Question,
           selectedOption, isCorrect, UNIQUE(attemptId,questionId))

TestResult(id PK, attemptId FK→TestAttempt UNIQUE, overallScore, sectionScores JSON,
           riasecScores JSON, topTypes[], strengths[], weaknesses[], completedAt)

ChatMessage(id PK, userId FK→User, role, content, createdAt)
```

---

## Functional Dependencies Summary

| Table | Functional Dependencies |
|---|---|
| User | id → fullName, email, passwordHash, phone, grade, board, schoolName, state, preferredLanguage, interests, dob, subjectMarks |
| Session | id → tokenHash, userId, expiresAt, revokedAt |
| TestSection | id → label, description, questionCount, type |
| Question | id → sectionId, question, options, correctAnswer, difficulty |
| Career | id → title, stream, icon, description, riasecTypes, requiredAptitudes, details |
| TestAttempt | id → userId, status, questionsAnswered, startedAt, completedAt |
| TestAnswer | id → attemptId, questionId, selectedOption, isCorrect |
| TestResult | id → attemptId, overallScore, sectionScores, riasecScores, topTypes, strengths, weaknesses |
| ChatMessage | id → userId, role, content, createdAt |

---

## Intentional Design Decisions (Semi-Denormalization)

| Field | Reason for JSONB / Array |
|---|---|
| `subjectMarks` (User) | Subject list varies by board and grade; storing as JSON avoids a sparse normalized table |
| `options` (Question) | Options are always read together with the question; embedding avoids a 4× JOIN |
| `sectionScores`, `riasecScores` (TestResult) | Dynamic score maps computed at test-time; schema varies by assessment version |
| `details` (Career) | Rich nested career data (colleges, salary ranges, roadmap) consumed as a whole; avoids 6+ extra tables |

These choices follow the principle of **purposeful denormalization** — the data inside each JSON column is internally consistent and accessed atomically, so it does not introduce anomalies.
