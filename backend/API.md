# PathFinder Backend – API Reference

Base URL: `http://localhost:5000/v1`

All protected routes require: `Authorization: Bearer <token>`

---

## Auth `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | ✗ | Create a new account |
| `POST` | `/auth/login` | ✗ | Log in and receive a session token |
| `GET` | `/auth/me` | ✓ | Return the current authenticated user |
| `POST` | `/auth/logout` | ✓ | Revoke the current session |
| `POST` | `/auth/forgot-password` | ✗ | Request a password-reset link (email provider required) |

### Register – Request Body
```json
{
  "fullName": "Priya Sharma",
  "email": "priya@example.com",
  "password": "Secure@123",
  "phone": "9876543210",
  "class": "11",
  "board": "CBSE",
  "schoolName": "Delhi Public School",
  "state": "Delhi",
  "preferredLanguage": "English",
  "interests": ["Science", "Technology"],
  "dob": "2008-05-14",
  "subjectMarks": { "Mathematics": 92, "Science": 88 }
}
```

---

## Users `/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/:userId/profile` | ✓ | Fetch the authenticated user's profile |
| `PATCH` | `/users/:userId/profile` | ✓ | Update profile fields (partial) |

---

## Dashboard `/dashboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard` | ✓ | Aggregated dashboard data |

**Response includes:** `testStatus`, `careerMatches`, `nextSteps`, `dailyFact`, `profileCompletion`

---

## Aptitude Test `/test`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/test/status` | ✓ | Current attempt status and section metadata |
| `GET` | `/test/questions` | ✓ | All questions (correct answers stripped) |
| `POST` | `/test/submit` | ✓ | Submit answers and get scored results |
| `GET` | `/test/results` | ✓ | Latest test result for the user |

### Submit – Request Body
```json
{
  "answers": {
    "q_lr_001": "Option A",
    "q_na_001": "72"
  }
}
```

---

## Careers `/careers`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/careers` | ✓ | List all careers (optional `?stream=Science`) |
| `GET` | `/careers/recommendations` | ✓ | Personalised sorted career matches |
| `GET` | `/careers/:id` | ✓ | Single career detail |

---

## AI Chat `/chat`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/chat` | ✓ | Send a message to the PathFinder AI counsellor |

Rate limit: **10 requests / minute**

### Request Body
```json
{ "message": "Which stream should I pick after 10th?" }
```

---

## Standard Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable status"
}
```

Error responses use `"success": false` with an appropriate HTTP status code.
