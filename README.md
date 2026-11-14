# PathFinder — AI Career Counselling Platform

AI-powered career counselling and aptitude assessment platform that helps secondary-level students discover their strengths, explore suitable careers, and receive personalised career roadmaps.

---

## Project Structure

```
Ai-career-counselling-platform/
├── backend/                # Express 5, Prisma ORM, PostgreSQL & Gemini AI API
│   ├── prisma/             # Schema, migrations & comprehensive seed data
│   ├── src/                # Modular REST routes, auth middleware, scoring engine
│   ├── API.md              # Full API specification and request/response shapes
│   └── package.json
├── frontend/               # React 19, Vite, Tailwind CSS v4 & Framer Motion
│   ├── src/
│   │   ├── components/     # UI design system & landing page components
│   │   ├── context/        # Auth, Language, Test, and Theme state providers
│   │   ├── pages/          # Dashboard, Career Explorer, Test, Counsellor, etc.
│   │   └── services/api.js # Unified REST API client connected to backend
│   └── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20 or higher
- **PostgreSQL**: Local database or hosted instance (e.g., Supabase / Neon)

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, and optional GEMINI_API_KEY

# Push database schema & generate Prisma Client
npm run prisma:generate
npm run db:deploy      # or npm run db:migrate for local dev

# Seed database with questions, careers, and test sections
npm run db:seed

# Start the backend server (runs on http://localhost:5000)
npm run dev
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (defaults to http://localhost:5000/v1)
cp .env.example .env

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

---

## Key Features

- **RIASEC & Cognitive Aptitude Assessment**: 4 cognitive domains (logical, numerical, verbal, spatial) + RIASEC interest profiling with real-time scoring.
- **Career Matching Engine**: Weighted algorithm combining aptitude scores and Holland Code interests to rank 20+ careers.
- **AI Career Counsellor**: Context-aware guidance powered by Google Gemini tailored to student assessment results.
- **Student Dashboard**: Progress tracking, personality radar charts, strength/growth indicators, and daily career facts.
- **Multilingual Support**: English, Hindi, and Kannada interface options.
- **Secure Authentication**: Salted bcrypt password hashing with bearer token session management.
