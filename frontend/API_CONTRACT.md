# PathFinder — API Contract

> **For the backend team.**
> Every function in `src/services/api.js` maps to one REST endpoint below.
> The frontend calls these functions and expects the exact response shapes shown here.
> When the backend is ready, replace the mock bodies in `api.js` with real `fetch` / `axios` calls — no component code needs to change.

---

## General conventions

| Convention | Detail |
|---|---|
| Base URL | `https://api.pathfinder.in/v1` (configure per environment) |
| Content-Type | `application/json` on all request bodies |
| Auth header | `Authorization: Bearer <token>` on every protected route |
| Success envelope | `{ "success": true, "data": { … }, "message": "…" }` |
| Error envelope | `{ "success": false, "data": null, "message": "Human-readable error" }` |
| Timestamps | ISO 8601 strings, e.g. `"2025-11-09T14:30:00Z"` |
| Salaries | Integer rupees per year, e.g. `500000` = ₹5 L |

---

## 1. Auth

### POST /auth/login

Log in with email and password. Returns a session token.

**Request body**
```json
{
  "email":    "demo@pathfinder.in",
  "password": "demo123"
}
```

**Success `200`**
```json
{
  "success": true,
  "data": {
    "user": {
      "id":                "usr_001",
      "fullName":          "Demo Student",
      "email":             "demo@pathfinder.in",
      "phone":             "9876543210",
      "class":             "12",
      "board":             "CBSE",
      "schoolName":        "Delhi Public School, R.K. Puram",
      "state":             "Delhi",
      "preferredLanguage": "English",
      "interests":         ["coding", "maths"],
      "dob":               "2008-03-15",
      "subjectMarks": {
        "maths": 85, "science": 78, "english": 91,
        "socialScience": 72, "secondLanguage": 88, "computer": 95
      },
      "createdAt": "2024-08-01T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
  },
  "message": "Logged in successfully"
}
```

**Errors**
| Status | Message |
|---|---|
| `401` | `"Incorrect email or password. Please check and try again."` |
| `422` | `"email is required"` |

---

### POST /auth/register

Create a new account. Returns the new user and a session token.

**Request body**
```json
{
  "fullName":          "Priya Sharma",
  "email":             "priya@example.com",
  "password":          "securepassword123",
  "phone":             "9988776655",
  "class":             "11",
  "board":             "ICSE",
  "schoolName":        "St. Xavier's High School",
  "state":             "Maharashtra",
  "preferredLanguage": "English",
  "interests":         ["biology", "music"],
  "dob":               "2008-07-20"
}
```

**Success `201`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "usr_1700000001234", "fullName": "Priya Sharma", "…": "…" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
  },
  "message": "Account created successfully"
}
```

**Errors**
| Status | Message |
|---|---|
| `409` | `"An account with this email already exists. Try logging in."` |
| `422` | `"email is required"` / `"password must be at least 8 characters"` |

---

### POST /auth/forgot-password

Trigger a password-reset email. Always responds `200` to prevent email enumeration.

**Request body**
```json
{ "email": "demo@pathfinder.in" }
```

**Success `200`**
```json
{
  "success": true,
  "data":    null,
  "message": "If that email is registered, a reset link has been sent."
}
```

---

### GET /auth/me

Validate a stored token and return the authenticated user. Called on page load to restore a session.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "usr_001", "fullName": "Demo Student", "…": "…" }
  },
  "message": "Session restored"
}
```

**Errors**
| Status | Message |
|---|---|
| `401` | `"Session expired. Please log in again."` |
| `404` | `"Account not found."` |

---

### POST /auth/logout

Invalidate the token server-side.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data":    null,
  "message": "Logged out successfully"
}
```

---

## 2. Profile

### GET /users/:userId/profile

Return the full user profile, including subject marks and date of birth.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id":                "usr_001",
      "fullName":          "Demo Student",
      "email":             "demo@pathfinder.in",
      "phone":             "9876543210",
      "class":             "12",
      "board":             "CBSE",
      "schoolName":        "Delhi Public School, R.K. Puram",
      "state":             "Delhi",
      "preferredLanguage": "English",
      "interests":         ["coding", "maths", "design"],
      "dob":               "2008-03-15",
      "subjectMarks": {
        "maths": 85, "science": 78, "english": 91,
        "socialScience": 72, "secondLanguage": 88, "computer": 95
      },
      "createdAt": "2024-08-01T10:30:00Z"
    }
  },
  "message": "Profile loaded"
}
```

**Errors**
| Status | Message |
|---|---|
| `404` | `"User not found."` |

---

### PATCH /users/:userId/profile

Merge-update user profile fields. Only provided fields are changed.

**Headers** `Authorization: Bearer <token>`

**Request body** _(any subset of profile fields)_
```json
{
  "phone":        "9112233445",
  "schoolName":   "Kendriya Vidyalaya No. 1",
  "subjectMarks": { "maths": 92, "science": 88 }
}
```

**Success `200`**
```json
{
  "success": true,
  "data": {
    "user": { "id": "usr_001", "fullName": "Demo Student", "phone": "9112233445", "…": "…" }
  },
  "message": "Profile updated successfully"
}
```

**Errors**
| Status | Message |
|---|---|
| `404` | `"User not found."` |

---

## 3. Dashboard

### GET /dashboard

Return everything the dashboard page needs in a single call.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data": {
    "profileCompletion": {
      "percentage": 75,
      "items": [
        { "id": "basic",    "label": "Basic info",       "done": true  },
        { "id": "marks",    "label": "Subject marks",    "done": true  },
        { "id": "test",     "label": "Aptitude test",    "done": false },
        { "id": "language", "label": "Language set",     "done": true  }
      ]
    },
    "testStatus": {
      "status":            "not_started",
      "questionsAnswered": 0,
      "totalQuestions":    40,
      "overallScore":      null
    },
    "careerMatches": [
      {
        "id":       "software_engineer",
        "title":    "Software Engineer",
        "stream":   "Technology",
        "icon":     "💻",
        "matchPct": 91,
        "description": "Design and build software applications…",
        "tags":     ["Problem Solving", "Coding", "Teamwork"]
      }
    ],
    "nextSteps": [
      { "id": "step_1", "text": "Complete your aptitude test", "done": false },
      { "id": "step_2", "text": "Review your career matches",  "done": false }
    ],
    "dailyFact": {
      "fact":   "India produces over 1.5 million engineering graduates every year.",
      "source": "AICTE Annual Report 2023"
    }
  },
  "message": "Dashboard data loaded"
}
```

> **Note:** `testStatus.overallScore` is `null` until the test is submitted. `careerMatches` can return a fixed curated list before the test is taken; after the test it should return the student's actual top matches sorted by `matchPct`.

---

## 4. Test

### GET /test/status

Lightweight call to check the student's test state and get section metadata. Used by the instructions page.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data": {
    "testStatus": {
      "status":            "not_started",
      "questionsAnswered": 0,
      "totalQuestions":    40,
      "completedAt":       null
    },
    "sections": [
      {
        "id":            "logical_reasoning",
        "label":         "Logical Reasoning",
        "description":   "Pattern recognition, sequences and deductive thinking.",
        "questionCount": 8,
        "type":          "aptitude"
      },
      {
        "id":            "numerical_ability",
        "label":         "Numerical Ability",
        "description":   "Arithmetic, data interpretation and number relationships.",
        "questionCount": 8,
        "type":          "aptitude"
      },
      {
        "id":            "verbal_ability",
        "label":         "Verbal Ability",
        "description":   "Vocabulary, comprehension and language use.",
        "questionCount": 8,
        "type":          "aptitude"
      },
      {
        "id":            "spatial_reasoning",
        "label":         "Spatial Reasoning",
        "description":   "Visualising shapes, patterns and 3D rotation.",
        "questionCount": 8,
        "type":          "aptitude"
      },
      {
        "id":            "interest_profile",
        "label":         "Interest Profile",
        "description":   "Statements about activities you enjoy. No right or wrong answers.",
        "questionCount": 12,
        "type":          "interest"
      }
    ]
  },
  "message": "Test status loaded"
}
```

**`status` enum values:** `"not_started"` | `"in_progress"` | `"completed"`

---

### GET /test/questions

Return all questions and section metadata. Called once when the test page loads.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id":        "lr_01",
        "section":   "logical_reasoning",
        "type":      "mcq",
        "text":      "Complete the series: 2, 6, 12, 20, 30, ?",
        "options":   ["38", "40", "42", "44"],
        "answer":    "42"
      },
      {
        "id":        "ip_01",
        "section":   "interest_profile",
        "type":      "interest",
        "text":      "I enjoy activities involving…",
        "options":   ["Art, Music or Drama", "Science and Experiments",
                      "Working with People", "Using Tools or Machines"],
        "riasecMap": {
          "Art, Music or Drama":       "A",
          "Science and Experiments":   "I",
          "Working with People":       "S",
          "Using Tools or Machines":   "R"
        }
      }
    ],
    "sections": [ "…same as /test/status…" ]
  },
  "message": "Questions loaded"
}
```

> **Note:** The `answer` field on aptitude questions is used for server-side scoring. Do not expose it to the client in the real implementation — remove it from the GET response and score on the server in `POST /test/submit`.

---

### POST /test/submit

Score all answers, persist the result, and mark the test as completed.

**Headers** `Authorization: Bearer <token>`

**Request body**
```json
{
  "answers": {
    "lr_01": "42",
    "lr_02": "Triangle",
    "na_01": "120",
    "ip_01": "Science and Experiments",
    "…":     "…"
  }
}
```
`answers` is a flat map of `questionId → selectedOptionText` covering all 40 questions.

**Success `200`**
```json
{
  "success": true,
  "data": {
    "result": {
      "overallScore":   74,
      "sectionScores": {
        "logical_reasoning": 75,
        "numerical_ability": 88,
        "verbal_ability":    62,
        "spatial_reasoning": 71
      },
      "riasecScores": { "R": 2, "I": 5, "A": 1, "S": 2, "E": 1, "C": 1 },
      "topTypes":     ["I", "R"],
      "strengths":    ["numerical_ability", "logical_reasoning"],
      "weaknesses":   ["verbal_ability"],
      "completedAt":  "2025-11-09T14:30:00Z"
    }
  },
  "message": "Test submitted successfully"
}
```

> **Scoring notes for the backend:**
> - `sectionScores`: percentage of aptitude questions answered correctly per section (0–100).
> - `overallScore`: average of all four aptitude section scores, rounded to integer.
> - `riasecScores`: count of interest-profile answers mapping to each RIASEC type (max 12 total across all 6 types).
> - `topTypes`: the two RIASEC types with the highest scores.
> - `strengths`: section ids scoring ≥ 60%; `weaknesses`: section ids scoring < 60%.

---

## 5. Results

### GET /test/results

Return the most recently scored test result for the authenticated user. Returns `null` in `data.result` if no test has been taken (never throws a 404 — the UI handles the empty state).

**Headers** `Authorization: Bearer <token>`

**Success `200` — test taken**
```json
{
  "success": true,
  "data": {
    "result": {
      "overallScore":   74,
      "sectionScores": { "logical_reasoning": 75, "numerical_ability": 88, "verbal_ability": 62, "spatial_reasoning": 71 },
      "riasecScores":  { "R": 2, "I": 5, "A": 1, "S": 2, "E": 1, "C": 1 },
      "topTypes":      ["I", "R"],
      "strengths":     ["numerical_ability", "logical_reasoning"],
      "weaknesses":    ["verbal_ability"],
      "completedAt":   "2025-11-09T14:30:00Z"
    }
  },
  "message": "Results loaded"
}
```

**Success `200` — no test taken**
```json
{
  "success": true,
  "data":    { "result": null },
  "message": "No test taken yet"
}
```

---

## 6. Careers

### GET /careers

Return all careers, optionally filtered by stream. Used by the Career Explorer page (no match percentages needed).

**Headers** `Authorization: Bearer <token>`

**Query params**
| Param | Type | Required | Description |
|---|---|---|---|
| `stream` | string | No | Filter to one stream, e.g. `Technology` |

**Success `200`**
```json
{
  "success": true,
  "data": {
    "careers": [
      {
        "id":          "software_engineer",
        "title":       "Software Engineer",
        "stream":      "Technology",
        "icon":        "💻",
        "description": "Design, build and maintain software applications and systems.",
        "riasecTypes": ["I", "R"],
        "requiredAptitudes": ["logical_reasoning", "numerical_ability"],
        "skills":      ["Problem Solving", "Coding", "Algorithms", "Teamwork", "Communication"],
        "salary": {
          "entry":  { "min": 500000,  "max": 1200000 },
          "mid":    { "min": 1200000, "max": 2500000 },
          "senior": { "min": 2500000, "max": 8000000 }
        },
        "entranceExams": [
          { "name": "JEE Main",     "desc": "For NIT/IIIT/GFTIs" },
          { "name": "JEE Advanced", "desc": "For IITs" }
        ],
        "topColleges": ["IIT Bombay", "IIT Delhi", "BITS Pilani", "NIT Trichy", "VIT Vellore"],
        "roadmap": [
          { "step": 1, "stage": "School",  "title": "Build a strong Maths base",         "desc": "Focus on Maths and Computer Science in Class 11–12." },
          { "step": 2, "stage": "Entrance","title": "Clear JEE / CUET",                   "desc": "Prepare for JEE Main for NITs or JEE Advanced for IITs." },
          { "step": 3, "stage": "Degree",  "title": "B.Tech Computer Science",            "desc": "4-year programme covering algorithms, OS, databases, networks." },
          { "step": 4, "stage": "Intern",  "title": "Internships",                        "desc": "Complete 1–2 internships to build a portfolio." },
          { "step": 5, "stage": "Entry",   "title": "Junior Developer",                   "desc": "Join a company as a junior engineer. Focus on one language." },
          { "step": 6, "stage": "Mid",     "title": "Senior Engineer / Tech Lead",        "desc": "Lead features and mentor junior developers." },
          { "step": 7, "stage": "Senior",  "title": "Principal / Architect / Founder",   "desc": "Define technical direction or start your own company." }
        ],
        "dayInTheLife":   "Reviewing code, pair programming, debugging, attending sprint standups, designing APIs.",
        "futureOutlook":  "Demand for software engineers is projected to grow 25% by 2030 as India expands its digital economy.",
        "relatedCareers": ["data_scientist", "game_developer"]
      }
    ]
  },
  "message": "Careers loaded"
}
```

---

### GET /careers/recommendations

Calculate a match percentage for every career based on the student's test results, then return all careers sorted by match descending. If the student has not taken the test, return all careers with `matchPct: null` and `hasResults: false`.

**Headers** `Authorization: Bearer <token>`

**Success `200` — test taken**
```json
{
  "success": true,
  "data": {
    "careers":    [ { "…": "full career object", "matchPct": 91 }, "…" ],
    "hasResults": true
  },
  "message": "Recommendations calculated"
}
```

**Success `200` — no test taken**
```json
{
  "success": true,
  "data": {
    "careers":    [ { "…": "full career object", "matchPct": null }, "…" ],
    "hasResults": false
  },
  "message": "No test results — showing all careers"
}
```

> **Match formula (reference implementation):**
> ```
> riasecMatch   = sum(career.riasecTypes scores from student's riasecScores) / 12 × 100   [capped at 100]
> aptitudeMatch = average of career.requiredAptitudes scores from student's sectionScores  [0–100 each]
> matchPct      = round(0.5 × riasecMatch + 0.5 × aptitudeMatch)
> ```
> The AI team may replace this formula with a more sophisticated model.

---

### GET /careers/:id

Return a single career by its slug id. Throws if not found.

**Headers** `Authorization: Bearer <token>`

**Success `200`**
```json
{
  "success": true,
  "data":    { "career": { "…": "full career object as above" } },
  "message": "Career loaded"
}
```

**Errors**
| Status | Message |
|---|---|
| `404` | `"Career \"software_engineer\" not found."` |

---

## 7. Chat

### POST /chat

Send a student message and receive a personalised counsellor reply.

> **AI integration point.** The backend should forward `message` and `context` to the AI model (Gemini / GPT / custom) and return the reply string. The context object lets the model personalise answers using the student's actual results.

**Headers** `Authorization: Bearer <token>`

**Request body**
```json
{
  "message": "Which stream suits me?",
  "context": {
    "testResult": {
      "overallScore": 74,
      "topTypes":     ["I", "R"],
      "sectionScores": { "logical_reasoning": 75, "numerical_ability": 88, "verbal_ability": 62, "spatial_reasoning": 71 }
    },
    "topCareers": ["Data Scientist", "Software Engineer", "Electrical Engineer"]
  }
}
```
Both `context.testResult` and `context.topCareers` are `null` / `[]` when the student has not taken the test yet.

**Success `200`**
```json
{
  "success": true,
  "data": {
    "reply": "Based on your aptitude score of 74%, your profile aligns well with **Data Scientist** and **Software Engineer**. These careers typically require PCM (Physics, Chemistry, Mathematics) in Class 11–12. Would you like a roadmap for either of these?"
  },
  "message": "Reply generated"
}
```

**Errors**
| Status | Message |
|---|---|
| `429` | `"Too many requests. Please wait a moment."` |
| `503` | `"AI service unavailable. Please try again shortly."` |

---

## Appendix A — User object fields

| Field | Type | Notes |
|---|---|---|
| `id` | string | `"usr_001"` |
| `fullName` | string | Full name as entered at registration |
| `email` | string | Lowercase, unique |
| `phone` | string | 10-digit mobile number |
| `class` | string | `"8"` through `"12"` |
| `board` | string | `"CBSE"` / `"ICSE"` / `"State Board"` / other |
| `schoolName` | string | Full school name |
| `state` | string | Indian state name |
| `preferredLanguage` | string | `"English"` or `"Hindi"` |
| `interests` | string[] | Free-form interest tags from registration |
| `dob` | string | ISO date `"YYYY-MM-DD"` |
| `subjectMarks` | object | `{ maths, science, english, socialScience, secondLanguage, computer }` — values 0–100 |
| `createdAt` | string | ISO timestamp |
| **password** | — | **Never returned to the client** |

---

## Appendix B — Integrating the backend

1. Install `axios` or use native `fetch`.
2. Open `src/services/api.js`.
3. Remove the `import MOCK_USERS …` block and all mock data imports at the top.
4. Replace each function body with a real HTTP call. The function signature and return shape must stay identical. Example:

```js
// Before (mock)
export async function loginUser(email, password) {
  await wait()
  const user = db.find(u => u.email === email)
  if (!user || user.password !== password) throw new Error('Incorrect email or password…')
  return { success: true, data: { user: publicUser(user), token }, message: '…' }
}

// After (real)
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json   // shape: { success, data: { user, token }, message }
}
```

5. Store the token in `localStorage` as `pf-token` (the `AuthContext` already does this).
6. Read `localStorage.getItem('pf-token')` and pass it in the `Authorization` header on every protected call.

---

*Last updated: 2026-11-09 · PathFinder frontend v1.0*
