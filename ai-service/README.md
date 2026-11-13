# PathFinder AI & Recommendation Service

FastAPI service powering aptitude scoring, career recommendations, explanations, personalised roadmaps, and the AI career counsellor for PathFinder (Indian Class 8–12 students).

---

## Quickstart

```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

Health check: `http://localhost:8000/health`

---

## Test Suite

```bash
cd ai-service
pytest -v
```

All 44 acceptance tests pass with 100% offline rule-based execution.

---

## API Endpoints

Every endpoint returns a standard envelope: `{ "success": true, "data": ..., "message": "..." }`.

### 1. `POST /ai/assess`
Scores cognitive sections (difficulty-weighted 0–100) and RIASEC interest counts/percentages.
- **Request Body:**
  ```json
  {
    "answers": { "1": "Paris", "2": "C" },
    "profile": { "class": 10, "subjectMarks": { "maths": 85, "science": 78 } },
    "language": "en"
  }
  ```
- **Response Data:**
  - `overallScore`: integer mean of 4 cognitive sections
  - `sectionScores`: `{ logical_reasoning, numerical_ability, verbal_ability, spatial_reasoning }`
  - `riasecScores`: raw counts (0–8)
  - `riasecPercent`: percentage (0–100) per Holland type
  - `topTypes`: top 2 RIASEC letters with deterministic tie-breaking
  - `strengths`: sections >= 60 (best first)
  - `weaknesses`: sections < 60 (lowest first)
  - `analysis`: Holland code, interest clarity, cognitive balance, academic divergence signals, bilingual profile summary

### 2. `POST /ai/recommendations`
Ranks all 20 careers using multi-factor Holland Hexagon similarity, aptitude fit, academic marks fit, and stated interests.
- **Request Body:** `{ "result": AssessResult, "profile": StudentProfile, "language": "en" }`
- **Response Data:** `{ "careers": [...20 careers with matchPct, breakdown, reasons, gaps], "topPicks": [...5 career ids, max 2 per stream], "hasResults": true }`

### 3. `POST /ai/explain`
Deterministic explanation for why a career fits or has gaps, plus what-if score simulation.
- **Request Body:** `{ "careerId": "software_engineer", "result": AssessResult, "profile": StudentProfile, "language": "en", "polish": false }`
- **Response Data:** `{ "headline": "...", "whyItFits": [3 items citing real scores], "watchOuts": [...], "whatWouldChange": [...what-if simulation], "confidence": "high", "source": "rules" }`

### 4. `POST /ai/roadmap`
Personalises the 7-step career roadmap for the student's class (8–12), marks, and aptitudes.
- **Request Body:** `{ "careerId": "software_engineer", "profile": StudentProfile, "result": AssessResult, "language": "en" }`
- **Response Data:** `{ "steps": [...], "streamAdvice": "...", "examPlan": [...], "focusAreas": [...], "backupPaths": [...], "source": "rules" }`

### 5. `POST /ai/chat`
Conversational career guidance grounded in `careers.json` (streams, Class 10 choices, exams, INR salary brackets).
- **Request Body:** `{ "message": "What stream should I pick?", "history": [], "context": { "topCareers": [...] }, "language": "en" }`
- **Response Data:** `{ "reply": "...", "source": "rules" }`

---

## Frontend Integration

Frontend components are ready under `frontend/src/components/ai/`:
- `CareerExplainer.jsx` — Renders explanations and what-if score changes
- `PersonalisedRoadmap.jsx` — Renders timeline with status badges (done/now/next/later), stream advice, and exam plans
- `AICounsellorChat.jsx` — Self-contained chat widget with bilingual support and offline fallback
- `frontend/src/services/aiApi.js` — Client library pointing to `http://localhost:8000` with graceful fallback to `api.js` if the Python service is offline

---

## Optional LLM Enrichment

The entire engine runs 100% offline using deterministic rule sets. To enable Gemini LLM rewording:
1. Create `ai-service/.env` (gitignored):
   ```
   LLM_API_KEY="your-gemini-api-key"
   LLM_MODEL="gemini-2.0-flash"
   ```
2. Grounding checks will strictly validate that the LLM does not hallucinate colleges, exams, or scores outside the verified data.

