# Project-Specific Queries – PathFinder AI Career Counselling Platform

All queries below are written in **PostgreSQL SQL** and directly correspond to real business operations performed by the PathFinder backend (via Prisma ORM). Each query includes the business use case, the SQL, and the expected output.

---

## Query 1 – Register a New User (INSERT)

**Business Use Case:** A student signs up on the platform. The backend hashes the password and stores the user record.

```sql
INSERT INTO "User" (
  id, "fullName", email, "passwordHash", phone,
  grade, board, "schoolName", state, "preferredLanguage",
  interests, dob, "subjectMarks", "createdAt", "updatedAt"
) VALUES (
  'clx_new_user_id_001',
  'Rahul Gupta',
  'rahul.gupta@example.com',
  '$2b$12$hashed_password_here',
  '9988776655',
  '12',
  'CBSE',
  'Kendriya Vidyalaya',
  'Uttar Pradesh',
  'Hindi',
  ARRAY['Science', 'Technology'],
  '2007-08-15',
  '{"Physics":85,"Chemistry":78,"Mathematics":92}',
  NOW(),
  NOW()
);
```

**Expected Output:**
```
INSERT 0 1
```

**Explanation:** Creates a new student account with academic details. The `passwordHash` is a bcrypt hash (never stored as plaintext). `interests` is a PostgreSQL array. `subjectMarks` is a JSONB column.

---

## Query 2 – User Login Lookup (SELECT with Filter)

**Business Use Case:** The backend looks up a user by email to verify login credentials.

```sql
SELECT id, "fullName", email, "passwordHash", grade, board, "preferredLanguage"
FROM "User"
WHERE email = 'priya.sharma@example.com';
```

**Expected Output:**

| id | fullName | email | passwordHash | grade | board | preferredLanguage |
|---|---|---|---|---|---|---|
| clx1a2b3c4d5e6f7g8h9 | Priya Sharma | priya.sharma@example.com | $2b$12$... | 11 | CBSE | English |

**Explanation:** The `@@index([email])` on the User table makes this lookup O(log n). The result is used by the backend to compare the bcrypt hash against the user-supplied password.

---

## Query 3 – Start a Test Attempt (INSERT)

**Business Use Case:** A student opens the test page for the first time. The backend creates an `IN_PROGRESS` attempt.

```sql
INSERT INTO "TestAttempt" (id, "userId", status, "questionsAnswered", "startedAt")
VALUES (
  'clx_attempt_new_001',
  'clx1a2b3c4d5e6f7g8h9',
  'IN_PROGRESS',
  0,
  NOW()
);
```

**Expected Output:**
```
INSERT 0 1
```

**Explanation:** This is the first database write of a test session. If the student refreshes the page, the backend finds this existing `IN_PROGRESS` attempt rather than creating a new one.

---

## Query 4 – Submit Test Answers (INSERT with batch)

**Business Use Case:** When a student submits the test, their answers are saved in bulk.

```sql
INSERT INTO "TestAnswer" (id, "attemptId", "questionId", "selectedOption", "isCorrect") VALUES
('ans_new_001', 'clx_attempt_new_001', 'lr_01', '38',     TRUE),
('ans_new_002', 'clx_attempt_new_001', 'lr_02', 'School', TRUE),
('ans_new_003', 'clx_attempt_new_001', 'na_01', '300',    TRUE),
('ans_new_004', 'clx_attempt_new_001', 'ip_01', 'Solving a maths puzzle', NULL);
```

**Expected Output:**
```
INSERT 0 4
```

**Explanation:** The `@@unique([attemptId, questionId])` constraint prevents duplicate answers. `isCorrect` is `NULL` for interest-profile questions (no right or wrong answer).

---

## Query 5 – Mark Attempt as Completed (UPDATE)

**Business Use Case:** After saving answers, the backend marks the attempt as COMPLETED.

```sql
UPDATE "TestAttempt"
SET status            = 'COMPLETED',
    "questionsAnswered" = 36,
    "completedAt"      = NOW()
WHERE id = 'clx_attempt_new_001'
  AND "userId" = 'clx1a2b3c4d5e6f7g8h9';
```

**Expected Output:**
```
UPDATE 1
```

**Explanation:** The `WHERE userId` clause ensures a user can only update their own attempt (security guard at DB level).

---

## Query 6 – Retrieve a Student's Latest Test Result (SELECT with JOIN + ORDER BY)

**Business Use Case:** The dashboard and results page fetch the most recent completed result for a logged-in student.

```sql
SELECT
  tr.id,
  tr."overallScore",
  tr."sectionScores",
  tr."riasecScores",
  tr."topTypes",
  tr.strengths,
  tr.weaknesses,
  tr."completedAt",
  ta."userId"
FROM "TestResult" tr
JOIN "TestAttempt" ta ON ta.id = tr."attemptId"
WHERE ta."userId" = 'clx1a2b3c4d5e6f7g8h9'
ORDER BY tr."completedAt" DESC
LIMIT 1;
```

**Expected Output:**

| id | overallScore | topTypes | completedAt |
|---|---|---|---|
| result_001 | 78 | {Investigative,Realistic} | 2026-11-20 10:42:00 |

**Explanation:** This JOIN traverses `TestResult → TestAttempt → User` to scope results to a specific user. `ORDER BY ... DESC LIMIT 1` retrieves the most recent attempt.

---

## Query 7 – Career Recommendations by RIASEC Match (SELECT with JOIN + Aggregate)

**Business Use Case:** After completing the test, the backend calculates a match score for each career based on the student's RIASEC profile.

```sql
-- Retrieve careers and filter by stream, sorted alphabetically
SELECT id, title, stream, description, "riasecTypes", "requiredAptitudes"
FROM "Career"
WHERE stream = 'Technology'
ORDER BY title ASC;
```

**Expected Output:**

| id | title | stream | riasecTypes |
|---|---|---|---|
| ai_ml_engineer | AI/ML Engineer | Technology | {Investigative,Realistic} |
| data_scientist | Data Scientist | Technology | {Investigative,Conventional} |
| software_engineer | Software Engineer | Technology | {Investigative,Realistic} |

**Explanation:** The `@@index([stream])` makes this filter efficient. The backend then computes match percentages in JavaScript using RIASEC scores from the TestResult.

---

## Query 8 – Chat History for a User (SELECT with Sorting + LIMIT)

**Business Use Case:** The AI chatbot needs the last 6 messages for multi-turn conversation context.

```sql
SELECT id, role, content, "createdAt"
FROM "ChatMessage"
WHERE "userId" = 'clx1a2b3c4d5e6f7g8h9'
ORDER BY "createdAt" DESC
LIMIT 6;
```

**Expected Output:**

| id | role | content | createdAt |
|---|---|---|---|
| chat_002 | counsellor | Based on your aptitude results... | 2026-11-20 11:00:05 |
| chat_001 | student | What career options are best suited... | 2026-11-20 11:00:00 |

**Explanation:** The `@@index([userId, createdAt])` composite index makes this pagination query extremely fast. The result is reversed in JavaScript before sending to the AI as chat history.

---

## Query 9 – Count Questions Answered Per Section (SELECT with GROUP BY + Aggregate)

**Business Use Case:** The admin/analytics view shows how many questions students answered per section.

```sql
SELECT
  q."sectionId",
  ts.label                AS section_label,
  COUNT(ta.id)            AS total_answers,
  SUM(CASE WHEN ta."isCorrect" = TRUE THEN 1 ELSE 0 END) AS correct_answers,
  ROUND(
    100.0 * SUM(CASE WHEN ta."isCorrect" = TRUE THEN 1 ELSE 0 END)
    / NULLIF(COUNT(ta.id), 0), 2
  )                       AS accuracy_percent
FROM "TestAnswer" ta
JOIN "Question"    q  ON q.id  = ta."questionId"
JOIN "TestSection" ts ON ts.id = q."sectionId"
WHERE ta."isCorrect" IS NOT NULL
GROUP BY q."sectionId", ts.label
ORDER BY q."sectionId";
```

**Expected Output:**

| sectionId | section_label | total_answers | correct_answers | accuracy_percent |
|---|---|---|---|---|
| logical_reasoning | Logical Reasoning | 320 | 240 | 75.00 |
| numerical_ability | Numerical Ability | 318 | 212 | 66.67 |
| verbal_ability | Verbal Ability | 315 | 236 | 74.92 |
| spatial_reasoning | Spatial Reasoning | 310 | 198 | 63.87 |

**Explanation:** This multi-table JOIN + GROUP BY + aggregate demonstrates analytical querying. `NULLIF(COUNT(...), 0)` prevents division-by-zero. `CASE WHEN` acts as a conditional count.

---

## Query 10 – Students Who Completed the Test (SELECT with Subquery + HAVING)

**Business Use Case:** Find all students who have completed the aptitude test and their average score, filtered to those scoring above 60.

```sql
SELECT
  u.id,
  u."fullName",
  u.email,
  u.grade,
  u.board,
  tr."overallScore",
  tr."topTypes",
  tr."completedAt"
FROM "User" u
JOIN "TestAttempt" ta ON ta."userId" = u.id
JOIN "TestResult"  tr ON tr."attemptId" = ta.id
WHERE ta.status = 'COMPLETED'
  AND tr."overallScore" > 60
ORDER BY tr."overallScore" DESC;
```

**Expected Output:**

| fullName | email | grade | board | overallScore | topTypes | completedAt |
|---|---|---|---|---|---|---|
| Priya Sharma | priya.sharma@example.com | 11 | CBSE | 78 | {Investigative,Realistic} | 2026-11-20 |
| Kavya Reddy | kavya.reddy@example.com | 10 | State Board | 65 | {Investigative,Social} | 2026-11-18 |

**Explanation:** This 3-table JOIN (User → TestAttempt → TestResult) with a `WHERE` filter and `ORDER BY` demonstrates how the platform can generate a ranked leaderboard or counsellor view of high-performing students.

---

## Query 11 – Update User Profile (UPDATE)

**Business Use Case:** A student updates their profile from the settings page.

```sql
UPDATE "User"
SET
  "fullName"   = 'Priya Sharma Kapoor',
  phone        = '9876543211',
  grade        = '12',
  "updatedAt"  = NOW()
WHERE id = 'clx1a2b3c4d5e6f7g8h9';
```

**Expected Output:**
```
UPDATE 1
```

**Explanation:** Only specific columns are updated — `email` and `passwordHash` are protected and never updated through this route.

---

## Query 12 – Revoke a Session on Logout (UPDATE)

**Business Use Case:** When a student logs out, their session token is revoked without being deleted (audit trail).

```sql
UPDATE "Session"
SET "revokedAt" = NOW()
WHERE id = 'sess_clx1a2b3c001'
  AND "userId" = 'clx1a2b3c4d5e6f7g8h9';
```

**Expected Output:**
```
UPDATE 1
```

**Explanation:** Setting `revokedAt` invalidates the session while preserving the record for audit purposes. The auth middleware checks `revokedAt IS NULL AND expiresAt > NOW()` on every request.

---

## Query 13 – Delete Stale Sessions (DELETE)

**Business Use Case:** A scheduled cleanup job removes expired and revoked sessions to keep the table lean.

```sql
DELETE FROM "Session"
WHERE "expiresAt" < NOW()
   OR "revokedAt" IS NOT NULL;
```

**Expected Output:**
```
DELETE 15  (number varies)
```

**Explanation:** This maintenance query removes rows that are no longer useful. Because `Session.userId` has `ON DELETE CASCADE`, deleting a user automatically removes their sessions — but this query handles the reverse (cleaning stale sessions without deleting users).

---

## Query 14 – Platform Statistics Dashboard (Aggregate + GROUP BY + HAVING)

**Business Use Case:** An admin overview showing completion rates per board.

```sql
SELECT
  u.board,
  COUNT(DISTINCT u.id)                   AS total_students,
  COUNT(DISTINCT ta.id)                  AS total_attempts,
  COUNT(DISTINCT CASE WHEN ta.status = 'COMPLETED' THEN ta.id END) AS completed_attempts,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN ta.status = 'COMPLETED' THEN ta.id END)
    / NULLIF(COUNT(DISTINCT ta.id), 0), 1
  )                                       AS completion_rate_pct,
  ROUND(AVG(tr."overallScore"), 1)        AS avg_score
FROM "User" u
LEFT JOIN "TestAttempt" ta ON ta."userId" = u.id
LEFT JOIN "TestResult"  tr ON tr."attemptId" = ta.id
WHERE u.board IS NOT NULL
GROUP BY u.board
HAVING COUNT(DISTINCT u.id) >= 1
ORDER BY total_students DESC;
```

**Expected Output:**

| board | total_students | total_attempts | completed_attempts | completion_rate_pct | avg_score |
|---|---|---|---|---|---|
| CBSE | 45 | 50 | 42 | 84.0 | 72.3 |
| ICSE | 18 | 20 | 15 | 75.0 | 68.9 |
| State Board | 12 | 13 | 10 | 76.9 | 65.4 |

**Explanation:** This complex query uses `LEFT JOIN`, multiple `COUNT(DISTINCT ...)` with `CASE WHEN` for conditional aggregation, `ROUND(AVG(...))`, `GROUP BY`, and `HAVING` — demonstrating advanced SQL analytics on real platform data.
