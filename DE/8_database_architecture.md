# Database Architecture and Implementation – PathFinder AI Career Counselling Platform

## 1. Executive Summary

PathFinder uses **PostgreSQL** as its primary database, accessed through **Prisma ORM** in a **Node.js / Express** backend. The database is hosted on **Neon** (serverless PostgreSQL cloud) with TLS-encrypted connections and connection pooling. The schema is fully normalized to 3NF with nine tables covering user management, authentication, aptitude assessment, career cataloguing, and AI chat history.

---

## 2. Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                     PathFinder Platform Architecture                   │
├───────────────┬───────────────────────┬───────────────────────────────┤
│   Frontend    │       Backend         │          Database              │
│  React + Vite │   Node.js + Express   │   PostgreSQL on Neon Cloud     │
│   Port 5173   │      Port 3000        │   Port 5432 (pooled)          │
│               │                       │                               │
│  ► Auth pages │  ► /api/auth/*        │  ► User                       │
│  ► Test UI    │  ► /api/test/*        │  ► Session                    │
│  ► Results    │  ► /api/careers/*     │  ► TestSection + Question     │
│  ► Careers    │  ► /api/dashboard     │  ► TestAttempt + TestAnswer   │
│  ► Chat       │  ► /api/chat         │  ► TestResult                 │
│               │                       │  ► Career                     │
│               │   Prisma ORM (6.x)    │  ► ChatMessage                │
└───────────────┴───────────────────────┴───────────────────────────────┘
```

---

## 3. Technology Stack

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Database | PostgreSQL | 16 | Primary data store |
| Cloud Host | Neon | — | Serverless PostgreSQL hosting |
| ORM | Prisma | 6.x | Schema management, type-safe queries, migrations |
| Backend | Node.js + Express | ≥20 | API server |
| Auth | bcryptjs + SHA-256 | — | Password hashing + session token hashing |
| Validation | Zod | 4.x | Request schema validation before DB writes |

---

## 4. Database Design Decisions

### 4.1 CUID as Primary Keys

All auto-generated primary keys use **CUID** (Collision-resistant Unique ID) instead of integer sequences or UUID v4.

**Reasons:**
- CUIDs are URL-safe and shorter than UUIDs.
- They are time-ordered (prefix encodes timestamp), enabling implicit chronological sorting without an extra index.
- They are safe to generate on the application side without a database round-trip.

### 4.2 String IDs for Seeded Data

`TestSection`, `Question`, and `Career` use **human-readable string IDs** (e.g., `logical_reasoning`, `lr_01`, `software_engineer`).

**Reasons:**
- The seed data is authored in JSON files; a readable ID makes debugging trivial.
- The backend joins and maps questions using their ID in JavaScript — a string key like `lr_01` is self-documenting.
- These records are never auto-generated; their IDs are stable across environments.

### 4.3 JSONB for Flexible Fields

The following fields use PostgreSQL's `JSONB` type rather than normalized sub-tables:

| Field | Reason |
|---|---|
| `User.subjectMarks` | Subject list varies by board; avoids sparse nullable columns |
| `Question.options` | Options are always read with the question; embedding is correct |
| `TestResult.sectionScores` | Key set depends on assessment version; schema-free |
| `TestResult.riasecScores` | 6 RIASEC types as a compact score map |
| `Career.details` | Rich nested object (salary, colleges, roadmap) consumed atomically |

JSONB fields are **indexed where queried** and stored in compressed binary format for fast reads.

### 4.4 Array Columns

PostgreSQL native `TEXT[]` arrays are used for:
- `User.interests` — list of interest tags (displayed in profile)
- `Career.riasecTypes` — RIASEC personality types aligned to this career
- `Career.requiredAptitudes` — section IDs used in match calculation
- `TestResult.topTypes`, `strengths`, `weaknesses` — computed lists from test scoring

Arrays avoid a join table for simple list storage where order does not matter.

### 4.5 Soft Deletes for Sessions

Sessions are **soft-deleted** (revokedAt is set rather than the row being deleted) to:
- Preserve an audit trail of all login events.
- Support future security features (e.g., "see all active sessions").
- Allow efficient cleanup via a scheduled batch job.

### 4.6 Atomic Transactions for Test Submission

The most critical write path — test submission — executes inside a Prisma `$transaction`. This wraps 5 database operations (find attempt, delete old answers, insert new answers, update attempt, upsert result) into a single atomic unit. A network failure or server crash mid-submission rolls back all changes.

---

## 5. Data Integrity Mechanisms

| Mechanism | Implementation | Purpose |
|---|---|---|
| Unique email | `@@unique` on User.email | Prevent duplicate accounts |
| Unique token | `@@unique` on Session.tokenHash | Prevent token collision |
| One answer per question | `@@unique([attemptId, questionId])` | No duplicate answers in one attempt |
| One result per attempt | `@@unique` on TestResult.attemptId | Exactly one result per attempt |
| Cascading deletes | `onDelete: Cascade` on FK relations | Referential integrity on user deletion |
| Restrict delete | `onDelete: Restrict` on TestAnswer.questionId | Questions cannot be deleted if answered |
| NOT NULL | Enforced at schema level for core fields | No incomplete records |
| Zod validation | In route handlers before any Prisma call | Invalid data never reaches the DB |
| bcrypt hashing | On User.passwordHash | Plaintext passwords never stored |
| SHA-256 token hash | On Session.tokenHash | Raw session tokens never stored |

---

## 6. Indexing Strategy

| Index | Table | Columns | Justification |
|---|---|---|---|
| `User_email_idx` | User | email | Login lookup (most frequent read) |
| `Session_userId_expiresAt` | Session | userId, expiresAt | List active sessions per user |
| `Question_sectionId_idx` | Question | sectionId | Load all questions by section |
| `Career_stream_idx` | Career | stream | Filter career catalogue by stream |
| `TestAttempt_userId_startedAt` | TestAttempt | userId, startedAt | Find latest attempt per user |
| `TestAnswer_questionId_idx` | TestAnswer | questionId | Join from Question side |
| `ChatMessage_userId_createdAt` | ChatMessage | userId, createdAt | Paginate chat history |

Composite indexes (`userId + startedAt`, `userId + createdAt`) support the most common access pattern: "get the latest N records for this user."

---

## 7. Performance Considerations

### Connection Pooling
The backend connects through **Neon's pooler endpoint**, which maintains a pool of PostgreSQL connections. This avoids the overhead of a new TCP + TLS + PostgreSQL handshake on every serverless invocation.

### Parallel Queries
Wherever the backend fetches multiple independent datasets (e.g., dashboard loading user, attempt, result, careers), `Promise.all()` is used to run all queries in parallel — reducing total API response time by the latency of the slowest single query rather than their sum.

### Query Scope
All user-facing queries are scoped by `userId` as the first filter. Because `userId` appears in the leading position of composite indexes (e.g., `[userId, startedAt]`), PostgreSQL can use an **index range scan** rather than a full table scan.

### JSONB vs Normalized Tables
Storing `sectionScores` and `riasecScores` as JSONB means the backend can retrieve and deserialize the full score map in a single column read without any additional joins — critical for the high-frequency results and dashboard endpoints.

### Scalability Path
| Scaling Need | Solution |
|---|---|
| Read-heavy career catalogue | Add Redis cache for `/api/careers` (rarely changes) |
| Growing chat history | Partition `ChatMessage` by `userId` or archive old messages |
| Analytics queries | Add a read replica and route reporting queries there |
| Session table growth | Scheduled job to hard-delete expired sessions older than 90 days |
| Assessment versioning | Add a `version` column to TestSection/Question for future test updates |

---

## 8. Folder Structure of DE Deliverables

```
DE/
├── 1_database_selection_and_justification.md   ← Why PostgreSQL
├── 2_er_diagram.md                             ← Entities, attributes, relationships
├── 3_normalization.md                          ← UNF → 1NF → 2NF → 3NF
├── 4_final_schema.md                           ← Prisma SDL + SQL DDL
├── 5_sample_records.md                         ← INSERT statements with data
├── 6_queries.md                                ← 14 project-specific queries
├── 7_database_backend_integration.md           ← How backend talks to DB
└── 8_database_architecture.md                 ← This document
```

---

## 9. Key Files in the Repository

| File | Description |
|---|---|
| [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) | Full Prisma schema (single source of truth) |
| [`backend/prisma/seed.js`](../backend/prisma/seed.js) | Seeds TestSections, Questions and Careers |
| [`backend/prisma/seed-data.json`](../backend/prisma/seed-data.json) | 36 test questions + career facts |
| [`backend/src/db.js`](../backend/src/db.js) | PrismaClient singleton + connection config |
| [`backend/src/middleware/auth.js`](../backend/src/middleware/auth.js) | Session-based auth middleware |
| [`backend/src/routes/auth.routes.js`](../backend/src/routes/auth.routes.js) | Register, Login, Logout |
| [`backend/src/routes/test.routes.js`](../backend/src/routes/test.routes.js) | Questions, Submit, Results |
| [`backend/src/routes/users.routes.js`](../backend/src/routes/users.routes.js) | Profile read + update |
| [`backend/src/routes/careers.routes.js`](../backend/src/routes/careers.routes.js) | Career list + recommendations |
| [`backend/src/routes/chat.routes.js`](../backend/src/routes/chat.routes.js) | AI counsellor chat |
| [`backend/src/routes/dashboard.routes.js`](../backend/src/routes/dashboard.routes.js) | Dashboard aggregation |
| [`backend/src/utils/scoring.js`](../backend/src/utils/scoring.js) | Test result calculation |
