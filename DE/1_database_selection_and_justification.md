# Database Selection and Justification

## Project: PathFinder – AI Career Counselling Platform

---

## 1. Selected Database

**PostgreSQL** (hosted on [Neon](https://neon.tech) – a serverless PostgreSQL cloud provider)

Accessed via the **Prisma ORM** in the Node.js / Express backend.

---

## 2. Nature of the Data

The PathFinder platform stores and processes the following categories of data:

| Category | Examples |
|---|---|
| **User Profiles** | Name, email, school, grade, board, DOB, subject marks, interests |
| **Authentication Sessions** | Token hashes, expiry timestamps, revocation status |
| **Assessment Content** | Test sections, questions, options, correct answers, difficulty |
| **Student Responses** | Per-question answers, correctness flags, attempt tracking |
| **Test Results** | Overall scores, section-wise scores, RIASEC scores, strengths/weaknesses |
| **Career Catalogue** | Career titles, streams, RIASEC types, aptitude requirements, details |
| **Chat History** | Conversation messages between student and AI counsellor |

---

## 3. Why PostgreSQL?

### 3.1 Structured and Relational Data

The platform's data is **highly relational**:
- A **User** has many **Sessions**, many **TestAttempts**, and many **ChatMessages**.
- A **TestAttempt** has many **TestAnswers** and exactly one **TestResult**.
- A **Question** belongs to a **TestSection** and can appear in many **TestAnswers**.

This web of relationships is naturally modelled with foreign keys and JOIN operations — exactly what a relational database is designed for.

### 3.2 Data Integrity Requirements

Career counselling demands **accuracy**:
- A student's test result must reference a valid attempt.
- Answers must reference valid questions.
- Cascading deletes (e.g., deleting a user removes all their sessions, attempts, answers and messages) are enforced at the database level using `ON DELETE CASCADE`.
- Unique constraints prevent duplicate session tokens and duplicate answers per question per attempt.

### 3.3 Complex Queries and Aggregations

The backend requires:
- **JOINs** across users, attempts, answers and results to calculate scores.
- **Aggregate functions** to count questions answered, compute overall scores.
- **Subqueries** to find the latest attempt or result per user.
- **Filtered queries** to retrieve careers by stream or rank them by match percentage.

PostgreSQL handles all of these natively and efficiently.

### 3.4 ACID Transactions

When a student submits the test, the backend wraps the entire operation — creating/updating the attempt, storing answers, and saving the result — in a **single atomic transaction** (`prisma.$transaction`). This guarantees that partial failures never leave corrupt data.

### 3.5 JSON Support for Semi-Structured Data

PostgreSQL's native `JSONB` column type allows the platform to store:
- `subjectMarks` – a flexible map of subject → mark percentage.
- `options` – per-question answer options (which may be plain strings or structured objects).
- `sectionScores`, `riasecScores` – dynamic score maps generated at result time.
- `details` – rich career metadata (salary ranges, colleges, roadmap) without imposing a rigid schema.

This hybrid approach gives us relational rigidity where we need it and schema flexibility where we don't.

### 3.6 Why Not MongoDB?

| Factor | PostgreSQL ✅ | MongoDB ❌ |
|---|---|---|
| Referential integrity (FK constraints) | Native | Manual, application-level |
| ACID transactions across collections | Full support | Supported but complex |
| Complex JOINs | Native SQL | Requires `$lookup` pipeline (costly) |
| Data relationships | Naturally modelled | Requires careful embedding/referencing |
| Mature tooling with Prisma ORM | Excellent | Good but fewer features |
| Neon serverless deployment | Native PostgreSQL | N/A |

MongoDB would have been a better choice if the data were document-centric with no fixed schema (e.g., a content management system). For PathFinder, the structured, relational nature of academic and assessment data makes PostgreSQL the superior choice.

---

## 4. Hosting

| Setting | Value |
|---|---|
| Provider | Neon (serverless PostgreSQL) |
| Region | Singapore (ap-southeast-1) |
| SSL | Required (`sslmode=require`) |
| ORM | Prisma 6.x |
| Connection pooling | Neon pooler endpoint |
