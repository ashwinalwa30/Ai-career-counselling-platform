# Project-Specific Database Queries – PathFinder AI Career Counselling Platform

All queries below are written in standard **PostgreSQL SQL** using the exact database schema, tables, column names (including double quotes for camelCase/reserved keywords like `"class"` and `"User"`), data types, and constraints defined in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) and applied via [`migration.sql`](../backend/prisma/migrations/20260309101828_init/migration.sql).

For each query, we provide:
1. **Business Use Case** (from the PathFinder platform)
2. **PostgreSQL SQL Query** (exact schema-compliant SQL)
3. **Prisma ORM Equivalent** (how the backend executes it)
4. **Expected Output** (tabular results)
5. **Technical Explanation & SQL Concepts Covered**

---

## Summary of SQL Concepts Covered

| Query | Concept | Tables Involved |
|---|---|---|
| **Query 1** | Single-row `INSERT` with JSONB & Arrays | `"User"` |
| **Query 2** | `SELECT` with `WHERE` Filtering & Index Lookup | `"User"` |
| **Query 3** | `INSERT` with PostgreSQL Enum (`"AttemptStatus"`) | `"TestAttempt"` |
| **Query 4** | Multi-row Batch `INSERT` with Unique Constraint Handling | `"TestAnswer"` |
| **Query 5** | `UPDATE` with Multiple Column Assignment & Timestamp | `"TestAttempt"` |
| **Query 6** | `INNER JOIN` (2 tables) with `ORDER BY` and `LIMIT` | `"TestResult"`, `"TestAttempt"` |
| **Query 7** | Multi-table `INNER JOIN` (3 tables) with Filtering | `"TestAnswer"`, `"Question"`, `"TestSection"` |
| **Query 8** | Subquery (`WHERE IN`) for Filtering Active Student Results | `"TestResult"`, `"TestAttempt"`, `"User"` |
| **Query 9** | `GROUP BY` and Aggregate Functions (`COUNT`, `SUM`, `ROUND`) | `"TestAnswer"`, `"Question"`, `"TestSection"` |
| **Query 10** | `GROUP BY` with `HAVING` and `AVG` / Conditional Aggregation | `"User"`, `"TestAttempt"`, `"TestResult"` |
| **Query 11** | `LEFT OUTER JOIN` to Identify Students with No Test Attempts | `"User"`, `"TestAttempt"` |
| **Query 12** | Advanced PostgreSQL Array Overlap (`&&`) for Career Matching | `"Career"`, `"TestResult"`, `"TestAttempt"` |
| **Query 13** | JSONB Querying (`->>` and `->`) on Assessment Data | `"User"`, `"TestResult"`, `"Career"` |
| **Query 14** | `DELETE` with Complex Date and Null Filtering | `"Session"` |

---

## Query 1: Register a New Student Account (INSERT)

### Business Use Case
When a student signs up on PathFinder (`POST /api/auth/register`), the backend stores their profile details, hashed credentials, educational board, class/grade, and initial subject scores.

### PostgreSQL SQL
```sql
INSERT INTO "User" (
    "id",
    "fullName",
    "email",
    "passwordHash",
    "phone",
    "class",
    "board",
    "schoolName",
    "state",
    "preferredLanguage",
    "interests",
    "dob",
    "subjectMarks",
    "createdAt",
    "updatedAt"
) VALUES (
    'usr_cm7a1b2c3d4e5f6g7h8i',
    'Rohan Kulkarni',
    'rohan.kulkarni@example.com',
    '$2b$12$e8yNZ9tqP7N1p7E3kQ4oLeO6uS5eD9f8g7h6j5k4l3m2n1o0p9q8r',
    '9823012345',
    '11',
    'CBSE',
    'Delhi Public School',
    'Maharashtra',
    'English',
    ARRAY['Artificial Intelligence', 'Mathematics', 'Robotics']::TEXT[],
    '2008-07-19'::DATE,
    '{"Mathematics": 94, "Physics": 89, "Computer Science": 96}'::JSONB,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

### Prisma ORM Equivalent (`backend/src/routes/auth.routes.js`)
```javascript
const user = await prisma.user.create({
  data: {
    fullName: 'Rohan Kulkarni',
    email: 'rohan.kulkarni@example.com',
    passwordHash: hashedPassword,
    phone: '9823012345',
    grade: '11', // maps to column "class" via @map("class")
    board: 'CBSE',
    schoolName: 'Delhi Public School',
    state: 'Maharashtra',
    preferredLanguage: 'English',
    interests: ['Artificial Intelligence', 'Mathematics', 'Robotics'],
    dob: new Date('2008-07-19'),
    subjectMarks: { Mathematics: 94, Physics: 89, 'Computer Science': 96 },
  },
});
```

### Expected Output
```text
INSERT 0 1
```

### Explanation & Concepts
- **Schema Mapping**: Note the column name `"class"` is quoted because `CLASS` is a SQL keyword, correctly matching Prisma's `grade String? @map("class")`.
- **PostgreSQL Native Types**: Demonstrates typed arrays (`TEXT[]`) and native `JSONB` insertion for dynamic subject marks.
- **Constraints Enforced**: Primary key uniqueness (`"User_pkey"`), email uniqueness (`"User_email_key"`), and non-null constraints on mandatory fields.

---

## Query 2: Authenticate User via Indexed Email Lookup (SELECT with Filtering)

### Business Use Case
When a student logs in (`POST /api/auth/login`), the backend retrieves the student's password hash and profile by email to verify their credentials.

### PostgreSQL SQL
```sql
SELECT 
    "id",
    "fullName",
    "email",
    "passwordHash",
    "class",
    "board",
    "preferredLanguage"
FROM "User"
WHERE "email" = 'ashwinalwa30@gmail.com'
LIMIT 1;
```

### Prisma ORM Equivalent (`backend/src/routes/auth.routes.js`)
```javascript
const user = await prisma.user.findUnique({
  where: { email: 'rohan.kulkarni@example.com' },
});
```

### Expected Output
| id | fullName | email | passwordHash | class | board | preferredLanguage |
|---|---|---|---|---|---|---|
| usr_cm7a1b2c3d4e5f6g7h8i | Rohan Kulkarni | rohan.kulkarni@example.com | $2b$12$e8yNZ9tqP7N... | 11 | CBSE | English |

### Explanation & Concepts
- **Index Optimization**: Utilizes the unique B-tree index `User_email_key` on `"User"("email")` for $O(\log n)$ lookup time.
- **Security Design**: Returns the salted bcrypt hash to the application layer for secure verification; never exposes raw passwords.

---

## Query 3: Initialize a Test Attempt with Enum (INSERT)

### Business Use Case
When a student starts an assessment session (`GET /api/test/questions`), the backend initializes an `IN_PROGRESS` attempt record.

### PostgreSQL SQL
```sql
INSERT INTO "TestAttempt" (
    "id",
    "userId",
    "status",
    "questionsAnswered",
    "startedAt",
    "completedAt"
) VALUES (
    'att_cm7t1a2b3c4d5e6f7g8h',
    'usr_cm7a1b2c3d4e5f6g7h8i',
    'IN_PROGRESS'::"AttemptStatus",
    0,
    CURRENT_TIMESTAMP,
    NULL
);
```

### Prisma ORM Equivalent (`backend/src/routes/test.routes.js`)
```javascript
const attempt = await prisma.testAttempt.create({
  data: {
    userId: req.user.id,
    status: 'IN_PROGRESS',
  },
});
```

### Expected Output
```text
INSERT 0 1
```

### Explanation & Concepts
- **PostgreSQL Enum Type**: The `"status"` column uses the custom enum type `"AttemptStatus"` with allowed values `'IN_PROGRESS'` or `'COMPLETED'`.
- **Foreign Key**: `"userId"` references `"User"("id")` with `ON DELETE CASCADE`.

---

## Query 4: Batch Insert Student Test Answers (Batch INSERT)

### Business Use Case
When a student submits answers for an assessment section (`POST /api/test/submit`), answers are persisted in bulk.

### PostgreSQL SQL
```sql
INSERT INTO "TestAnswer" (
    "id",
    "attemptId",
    "questionId",
    "selectedOption",
    "isCorrect"
) VALUES 
    ('ans_001', 'att_cm7t1a2b3c4d5e6f7g8h', 'lr_01', '38', TRUE),
    ('ans_002', 'att_cm7t1a2b3c4d5e6f7g8h', 'lr_02', 'School', TRUE),
    ('ans_003', 'att_cm7t1a2b3c4d5e6f7g8h', 'na_01', '300', TRUE),
    ('ans_004', 'att_cm7t1a2b3c4d5e6f7g8h', 'ip_01', 'Designing a website', NULL)
ON CONFLICT ("attemptId", "questionId") 
DO UPDATE SET 
    "selectedOption" = EXCLUDED."selectedOption",
    "isCorrect" = EXCLUDED."isCorrect";
```

### Prisma ORM Equivalent (`backend/src/routes/test.routes.js`)
```javascript
await tx.testAnswer.createMany({
  data: answerRows,
  skipDuplicates: true,
});
```

### Expected Output
```text
INSERT 0 4
```

### Explanation & Concepts
- **Composite Unique Key**: The schema enforces `@@unique(["attemptId", "questionId"])` via index `TestAnswer_attemptId_questionId_key`.
- **Upsert Semantics**: Uses `ON CONFLICT` to handle re-answering without generating duplicate row errors.
- **Nullable Correctness**: For interest inventory questions (`ip_01`), `"isCorrect"` is `NULL` since personality profiling has no right/wrong answers.

---

## Query 5: Complete Test Attempt and Update Progress (UPDATE)

### Business Use Case
Upon final submission, the test attempt is marked as `COMPLETED` along with the count of answered questions and completion timestamp.

### PostgreSQL SQL
```sql
UPDATE "TestAttempt"
SET 
    "status" = 'COMPLETED'::"AttemptStatus",
    "questionsAnswered" = 36,
    "completedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'att_cm7t1a2b3c4d5e6f7g8h'
  AND "userId" = 'usr_cm7a1b2c3d4e5f6g7h8i';
```

### Prisma ORM Equivalent (`backend/src/routes/test.routes.js`)
```javascript
await tx.testAttempt.update({
  where: { id: attempt.id },
  data: {
    status: 'COMPLETED',
    questionsAnswered: 36,
    completedAt: new Date(),
  },
});
```

### Expected Output
```text
UPDATE 1
```

### Explanation & Concepts
- **Data Integrity**: The `WHERE "userId"` condition verifies ownership before updating, preventing cross-user data tampering.
- **State Transition**: Transitions the record from `'IN_PROGRESS'` to `'COMPLETED'`.

---

## Query 6: Retrieve Latest Assessment Result (INNER JOIN with Sorting)

### Business Use Case
The dashboard (`GET /api/dashboard`) loads the student's latest completed test score, RIASEC profile, and identified strengths.

### PostgreSQL SQL
```sql
SELECT 
    tr."id" AS "resultId",
    tr."overallScore",
    tr."sectionScores",
    tr."riasecScores",
    tr."topTypes",
    tr."strengths",
    tr."weaknesses",
    ta."startedAt",
    tr."completedAt"
FROM "TestResult" tr
INNER JOIN "TestAttempt" ta ON ta."id" = tr."attemptId"
WHERE ta."userId" = 'usr_cm7a1b2c3d4e5f6g7h8i'
  AND ta."status" = 'COMPLETED'
ORDER BY tr."completedAt" DESC
LIMIT 1;
```

### Prisma ORM Equivalent (`backend/src/routes/test.routes.js`)
```javascript
const result = await prisma.testResult.findFirst({
  where: {
    attempt: {
      userId: req.user.id,
      status: 'COMPLETED',
    },
  },
  orderBy: { completedAt: 'desc' },
});
```

### Expected Output
| resultId | overallScore | topTypes | strengths | completedAt |
|---|---|---|---|---|
| res_cm7r9x8y7z6w | 86 | {Investigative,Realistic} | {"Logical Reasoning","Numerical Ability"} | 2026-11-22 20:30:00 |

### Explanation & Concepts
- **INNER JOIN**: Joins `"TestResult"` with `"TestAttempt"` on `tr."attemptId" = ta."id"`.
- **Relational Traversal**: Navigates the 1-to-1 relationship defined by foreign key `TestResult_attemptId_fkey`.
- **Ordering & Limit**: Returns exactly one most recent record via `ORDER BY ... DESC LIMIT 1`.

---

## Query 7: Detailed Student Answer Review (Multi-Table INNER JOIN)

### Business Use Case
Generates a detailed test review showing the question asked, section name, student's selected answer, correct answer, and correctness flag.

### PostgreSQL SQL
```sql
SELECT 
    ts."label" AS "sectionName",
    q."question" AS "questionText",
    q."difficulty",
    ans."selectedOption",
    q."correctAnswer",
    ans."isCorrect"
FROM "TestAnswer" ans
INNER JOIN "Question" q ON q."id" = ans."questionId"
INNER JOIN "TestSection" ts ON ts."id" = q."sectionId"
WHERE ans."attemptId" = 'att_cm7t1a2b3c4d5e6f7g8h'
ORDER BY ts."id" ASC, q."id" ASC;
```

### Prisma ORM Equivalent
```javascript
const answers = await prisma.testAnswer.findMany({
  where: { attemptId: 'att_cm7t1a2b3c4d5e6f7g8h' },
  include: {
    question: {
      include: { section: true },
    },
  },
  orderBy: [{ question: { sectionId: 'asc' } }, { questionId: 'asc' }],
});
```

### Expected Output
| sectionName | questionText | difficulty | selectedOption | correctAnswer | isCorrect |
|---|---|---|---|---|---|
| Logical Reasoning | What comes next in the series: 3, 6, 11, 18, 27, ? | easy | 38 | 38 | true |
| Logical Reasoning | Doctor is to Hospital as Teacher is to ___. | easy | School | School | true |
| Numerical Ability | If 15% of a number is 45, what is the number? | easy | 300 | 300 | true |

### Explanation & Concepts
- **Multi-Table Join**: Traverses `TestAnswer → Question → TestSection` across 3 normalized tables.
- **Referential Integrity**: Demonstrates how foreign keys (`Question_sectionId_fkey`, `TestAnswer_questionId_fkey`) link questions to sections and answers to questions.

---

## Query 8: High Achiever Students (Subquery with IN Clause)

### Business Use Case
The administration portal selects all students whose test scores place them in the top tier (score $\ge 80$), using a subquery on the `"TestResult"` table.

### PostgreSQL SQL
```sql
SELECT 
    u."id",
    u."fullName",
    u."email",
    u."class",
    u."board",
    u."schoolName"
FROM "User" u
WHERE u."id" IN (
    SELECT ta."userId"
    FROM "TestAttempt" ta
    INNER JOIN "TestResult" tr ON tr."attemptId" = ta."id"
    WHERE tr."overallScore" >= 80
)
ORDER BY u."fullName" ASC;
```

### Expected Output
| id | fullName | email | class | board | schoolName |
|---|---|---|---|---|---|
| usr_cm7a1b2c3d4e5f6g7h8i | Rohan Kulkarni | rohan.kulkarni@example.com | 11 | CBSE | Delhi Public School |
| usr_clx1a2b3c4d5e6f7g8h9 | Priya Sharma | priya.sharma@example.com | 11 | CBSE | Delhi Public School |

### Explanation & Concepts
- **Subquery (IN operator)**: Isolates the user ID resolution logic into an independent nested query.
- **Set Membership**: Filters outer `"User"` rows against the result set of the inner join.

---

## Query 9: Section-Wise Accuracy Analytics (GROUP BY + Aggregate Functions)

### Business Use Case
Calculates system-wide student performance metrics per cognitive section to identify which test categories are hardest for students.

### PostgreSQL SQL
```sql
SELECT 
    ts."id" AS "sectionCode",
    ts."label" AS "sectionTitle",
    COUNT(ans."id") AS "totalResponses",
    COUNT(CASE WHEN ans."isCorrect" = TRUE THEN 1 END) AS "correctAnswers",
    COUNT(CASE WHEN ans."isCorrect" = FALSE THEN 1 END) AS "incorrectAnswers",
    ROUND(
        AVG(CASE WHEN ans."isCorrect" = TRUE THEN 100.0 ELSE 0.0 END), 2
    ) AS "accuracyPercentage"
FROM "TestSection" ts
INNER JOIN "Question" q ON q."sectionId" = ts."id"
INNER JOIN "TestAnswer" ans ON ans."questionId" = q."id"
WHERE ts."type" = 'cognitive'
GROUP BY ts."id", ts."label"
ORDER BY "accuracyPercentage" DESC;
```

### Expected Output
| sectionCode | sectionTitle | totalResponses | correctAnswers | incorrectAnswers | accuracyPercentage |
|---|---|---|---|---|---|
| verbal_ability | Verbal Ability | 180 | 144 | 36 | 80.00 |
| logical_reasoning | Logical Reasoning | 180 | 135 | 45 | 75.00 |
| numerical_ability | Numerical Ability | 180 | 120 | 60 | 66.67 |
| spatial_reasoning | Spatial Reasoning | 180 | 110 | 70 | 61.11 |

### Explanation & Concepts
- **Aggregate Functions**: Uses `COUNT()`, `AVG()`, and `ROUND()`.
- **Conditional Aggregation**: Uses `CASE WHEN` inside aggregate functions to compute counts and percentages conditionally.
- **GROUP BY**: Groups rows by section primary key and label.

---

## Query 10: Academic Board Performance Benchmark (GROUP BY + HAVING)

### Business Use Case
Compares average aptitude scores across educational boards (CBSE, ICSE, State Board), filtering for boards with at least 2 completed attempts.

### PostgreSQL SQL
```sql
SELECT 
    u."board",
    COUNT(DISTINCT u."id") AS "totalStudents",
    COUNT(tr."id") AS "completedTests",
    ROUND(AVG(tr."overallScore"), 2) AS "averageScore",
    MIN(tr."overallScore") AS "lowestScore",
    MAX(tr."overallScore") AS "highestScore"
FROM "User" u
INNER JOIN "TestAttempt" ta ON ta."userId" = u."id"
INNER JOIN "TestResult" tr ON tr."attemptId" = ta."id"
WHERE u."board" IS NOT NULL
GROUP BY u."board"
HAVING COUNT(tr."id") >= 2
ORDER BY "averageScore" DESC;
```

### Expected Output
| board | totalStudents | completedTests | averageScore | lowestScore | highestScore |
|---|---|---|---|---|---|
| CBSE | 12 | 14 | 78.50 | 62 | 94 |
| ICSE | 8 | 8 | 74.25 | 58 | 88 |
| State Board | 5 | 5 | 68.40 | 52 | 82 |

### Explanation & Concepts
- **GROUP BY with HAVING**: Groups by `u."board"` and filters grouped aggregate results using `HAVING COUNT(tr."id") >= 2`.
- **Multiple Aggregates**: Combines `COUNT(DISTINCT ...)`, `AVG()`, `MIN()`, and `MAX()`.

---

## Query 11: Identify Inactive or Drop-off Students (LEFT OUTER JOIN)

### Business Use Case
Identifies registered students who have either never started a test or whose attempt is still pending, enabling automated guidance reminders.

### PostgreSQL SQL
```sql
SELECT 
    u."id" AS "studentId",
    u."fullName",
    u."email",
    u."class",
    u."createdAt" AS "registeredAt",
    ta."id" AS "attemptId",
    ta."status" AS "attemptStatus"
FROM "User" u
LEFT OUTER JOIN "TestAttempt" ta ON ta."userId" = u."id"
WHERE ta."id" IS NULL 
   OR ta."status" = 'IN_PROGRESS'
ORDER BY u."createdAt" DESC;
```

### Expected Output
| studentId | fullName | email | class | registeredAt | attemptId | attemptStatus |
|---|---|---|---|---|---|---|
| usr_new_999 | Anita Desai | anita.desai@example.com | 10 | 2026-11-22 18:10:00 | NULL | NULL |
| usr_prog_888 | Vikas Roy | vikas.roy@example.com | 12 | 2026-11-21 14:00:00 | att_088 | IN_PROGRESS |

### Explanation & Concepts
- **LEFT OUTER JOIN**: Retains all rows from `"User"` regardless of whether a matching row exists in `"TestAttempt"`.
- **Null Checking**: `ta."id" IS NULL` pinpoints students who have zero assessment records.

---

## Query 12: Career Recommendation Matching via Array Overlap (PostgreSQL Array Query)

### Business Use Case
Matches career paths from the catalogue (`"Career"`) against the student's top RIASEC personality types stored in `"TestResult"`.

### PostgreSQL SQL
```sql
SELECT 
    c."id" AS "careerCode",
    c."title" AS "careerTitle",
    c."stream",
    c."riasecTypes",
    tr."topTypes" AS "studentTopTypes"
FROM "Career" c
CROSS JOIN (
    SELECT tr_sub."topTypes"
    FROM "TestResult" tr_sub
    INNER JOIN "TestAttempt" ta_sub ON ta_sub."id" = tr_sub."attemptId"
    WHERE ta_sub."userId" = 'usr_cm7a1b2c3d4e5f6g7h8i'
    ORDER BY tr_sub."completedAt" DESC
    LIMIT 1
) tr
WHERE c."riasecTypes" && tr."topTypes"
ORDER BY c."stream" ASC, c."title" ASC;
```

### Prisma ORM Equivalent (`backend/src/routes/careers.routes.js`)
```javascript
const [careers, result] = await Promise.all([
  prisma.career.findMany(),
  prisma.testResult.findFirst({
    where: { attempt: { userId: req.user.id } },
    orderBy: { completedAt: 'desc' },
  }),
]);
// Matching calculated using RIASEC intersection in JavaScript
```

### Expected Output
| careerCode | careerTitle | stream | riasecTypes | studentTopTypes |
|---|---|---|---|---|
| ai_ml_engineer | AI/ML Engineer | Technology | {Investigative,Realistic} | {Investigative,Realistic} |
| data_scientist | Data Scientist | Technology | {Investigative,Conventional} | {Investigative,Realistic} |
| software_engineer | Software Engineer | Technology | {Investigative,Realistic} | {Investigative,Realistic} |

### Explanation & Concepts
- **PostgreSQL Array Overlap Operator (`&&`)**: Evaluates whether two `TEXT[]` arrays share any common elements (`c."riasecTypes" && tr."topTypes"`).
- **Subquery in FROM Clause (Derived Table)**: Retrieves the single latest RIASEC personality profile for the specified student.

---

## Query 13: Querying Nested JSONB Data for Career Salary Benchmarks

### Business Use Case
Extracts structured salary packages and top colleges from the `"details"` JSONB column of `"Career"` to present counselling data.

### PostgreSQL SQL
```sql
SELECT 
    "id",
    "title",
    "stream",
    ("details"->'salary'->'entry'->>'min')::NUMERIC AS "entryMinSalary",
    ("details"->'salary'->'entry'->>'max')::NUMERIC AS "entryMaxSalary",
    "details"->'topColleges' AS "targetColleges"
FROM "Career"
WHERE ("details"->'salary'->'entry'->>'min')::NUMERIC >= 500000
ORDER BY "entryMinSalary" DESC;
```

### Expected Output
| id | title | stream | entryMinSalary | entryMaxSalary | targetColleges |
|---|---|---|---|---|---|
| software_engineer | Software Engineer | Technology | 500000 | 1200000 | ["IIT Bombay", "NIT Trichy", "BITS Pilani"] |
| doctor_mbbs | Doctor (MBBS) | Medical | 600000 | 1000000 | ["AIIMS Delhi", "CMC Vellore"] |

### Explanation & Concepts
- **JSONB Navigation Operators**:
  - `->` extracts a JSON object/array field while preserving JSON type.
  - `->>` extracts the field as standard text, enabling casting to `NUMERIC` for comparisons.
- **Schema Alignment**: Demonstrates how semi-structured data inside `"Career"."details"` is indexed and queried.

---

## Query 14: Expired Session Cleanup (DELETE with Date Arithmetic)

### Business Use Case
Background maintenance task that removes expired or revoked user login tokens (`"Session"` table) to maintain database hygiene.

### PostgreSQL SQL
```sql
DELETE FROM "Session"
WHERE "expiresAt" < CURRENT_TIMESTAMP
   OR "revokedAt" IS NOT NULL;
```

### Prisma ORM Equivalent
```javascript
await prisma.session.deleteMany({
  where: {
    OR: [
      { expiresAt: { lt: new Date() } },
      { revokedAt: { not: null } },
    ],
  },
});
```

### Expected Output
```text
DELETE 12
```

### Explanation & Concepts
- **DELETE with Compound Predicate**: Evaluates both timestamp expiry (`"expiresAt" < CURRENT_TIMESTAMP`) and soft revocation flags (`"revokedAt" IS NOT NULL`).
- **Cascading Safety**: Deleting sessions does not affect the associated `"User"` record, as the foreign key cascade direction is User $\rightarrow$ Session.

---

## Verification and Execution Notes

To test and execute these queries directly against the PostgreSQL database:
1. Connect using the command line:
   ```bash
   psql "$DATABASE_URL"
   ```
2. Or use Prisma Studio to inspect the generated tables:
   ```bash
   npm run db:studio --prefix backend
   ```
3. All table names (`"User"`, `"Session"`, `"TestSection"`, `"Question"`, `"Career"`, `"TestAttempt"`, `"TestAnswer"`, `"TestResult"`, `"ChatMessage"`) and quoted columns (`"class"`, `"fullName"`, `"passwordHash"`, etc.) match PostgreSQL's case sensitivity requirements.
