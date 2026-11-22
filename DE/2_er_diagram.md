# ER Diagram – PathFinder AI Career Counselling Platform

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         User                            │
│─────────────────────────────────────────────────────────│
│ PK  id               : String (CUID)                    │
│     fullName         : String                           │
│     email            : String (UNIQUE)                  │
│     passwordHash     : String                           │
│     phone            : String?                          │
│     grade            : String?                          │
│     board            : String?                          │
│     schoolName       : String?                          │
│     state            : String?                          │
│     preferredLanguage: String                           │
│     interests        : String[]                         │
│     dob              : Date?                            │
│     subjectMarks     : Json?                            │
│     createdAt        : DateTime                         │
│     updatedAt        : DateTime                         │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┴──────┐─────────────────────┐
        │             │                     │
        ▼             ▼                     ▼
┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
│   Session    │ │ TestAttempt  │  │   ChatMessage    │
│──────────────│ │──────────────│  │──────────────────│
│PK id         │ │PK id         │  │PK id             │
│FK userId ────┤ │FK userId ────┤  │FK userId ────────┤
│   tokenHash  │ │   status     │  │   role           │
│   expiresAt  │ │   questionsAns│  │   content        │
│   revokedAt? │ │   startedAt  │  │   createdAt      │
│   createdAt  │ │   completedAt│  └──────────────────┘
└──────────────┘ └──────┬───────┘
                        │
              ┌─────────┴──────────┐
              │                    │
              ▼                    ▼
     ┌──────────────┐    ┌──────────────────┐
     │  TestAnswer  │    │   TestResult     │
     │──────────────│    │──────────────────│
     │PK id         │    │PK id             │
     │FK attemptId ─┤    │FK attemptId ─────┤ (1:1)
     │FK questionId─┼──► │   overallScore   │
     │   selectedOpt│    │   sectionScores  │
     │   isCorrect? │    │   riasecScores   │
     └──────────────┘    │   topTypes       │
              │          │   strengths      │
              │          │   weaknesses     │
              ▼          │   completedAt    │
     ┌──────────────┐    └──────────────────┘
     │   Question   │
     │──────────────│
     │PK id         │
     │FK sectionId ─┼──►┌──────────────────┐
     │   question   │   │   TestSection    │
     │   options    │   │──────────────────│
     │   correctAns │   │PK id             │
     │   difficulty │   │   label          │
     └──────────────┘   │   description    │
                        │   questionCount  │
     ┌──────────────┐   │   type           │
     │   Career     │   └──────────────────┘
     │──────────────│
     │PK id         │
     │   title      │
     │   stream     │
     │   icon       │
     │   description│
     │   riasecTypes│
     │   requiredApt│
     │   details    │
     └──────────────┘
```

---

## Entities and Attributes

### 1. User
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| fullName | String | NOT NULL |
| email | String | NOT NULL, UNIQUE |
| passwordHash | String | NOT NULL |
| phone | String | NULLABLE |
| grade | String | NULLABLE |
| board | String | NULLABLE |
| schoolName | String | NULLABLE |
| state | String | NULLABLE |
| preferredLanguage | String | DEFAULT 'English' |
| interests | String[] | DEFAULT [] |
| dob | Date | NULLABLE |
| subjectMarks | JSON | NULLABLE |
| createdAt | DateTime | DEFAULT now() |
| updatedAt | DateTime | AUTO |

### 2. Session
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| tokenHash | String | NOT NULL, UNIQUE |
| userId | String | FOREIGN KEY → User.id (CASCADE) |
| expiresAt | DateTime | NOT NULL |
| revokedAt | DateTime | NULLABLE |
| createdAt | DateTime | DEFAULT now() |

### 3. TestSection
| Attribute | Type | Constraint |
|---|---|---|
| id | String | PRIMARY KEY |
| label | String | NOT NULL |
| description | String | NOT NULL |
| questionCount | Int | NOT NULL |
| type | String | NOT NULL |

### 4. Question
| Attribute | Type | Constraint |
|---|---|---|
| id | String | PRIMARY KEY |
| sectionId | String | FOREIGN KEY → TestSection.id (CASCADE) |
| question | String | NOT NULL |
| options | JSON | NOT NULL |
| correctAnswer | String | NULLABLE |
| difficulty | String | NOT NULL |

### 5. Career
| Attribute | Type | Constraint |
|---|---|---|
| id | String | PRIMARY KEY |
| title | String | NOT NULL |
| stream | String | NOT NULL |
| icon | String | NOT NULL |
| description | String | NOT NULL |
| riasecTypes | String[] | DEFAULT [] |
| requiredAptitudes | String[] | DEFAULT [] |
| details | JSON | NOT NULL |

### 6. TestAttempt
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| userId | String | FOREIGN KEY → User.id (CASCADE) |
| status | Enum (IN_PROGRESS, COMPLETED) | DEFAULT IN_PROGRESS |
| questionsAnswered | Int | DEFAULT 0 |
| startedAt | DateTime | DEFAULT now() |
| completedAt | DateTime | NULLABLE |

### 7. TestAnswer
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| attemptId | String | FOREIGN KEY → TestAttempt.id (CASCADE) |
| questionId | String | FOREIGN KEY → Question.id (RESTRICT) |
| selectedOption | String | NOT NULL |
| isCorrect | Boolean | NULLABLE |
| | | UNIQUE(attemptId, questionId) |

### 8. TestResult
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| attemptId | String | FOREIGN KEY → TestAttempt.id (CASCADE), UNIQUE |
| overallScore | Int | NOT NULL |
| sectionScores | JSON | NOT NULL |
| riasecScores | JSON | NOT NULL |
| topTypes | String[] | NOT NULL |
| strengths | String[] | NOT NULL |
| weaknesses | String[] | NOT NULL |
| completedAt | DateTime | DEFAULT now() |

### 9. ChatMessage
| Attribute | Type | Constraint |
|---|---|---|
| id | String (CUID) | PRIMARY KEY |
| userId | String | FOREIGN KEY → User.id (CASCADE) |
| role | String | NOT NULL ('student' or 'counsellor') |
| content | String | NOT NULL |
| createdAt | DateTime | DEFAULT now() |

---

## Relationships Summary

| Relationship | Type | Description |
|---|---|---|
| User → Session | One-to-Many | A user can have multiple active sessions (devices) |
| User → TestAttempt | One-to-Many | A user can retake the assessment |
| User → ChatMessage | One-to-Many | A user accumulates chat history over time |
| TestSection → Question | One-to-Many | Each section contains multiple questions |
| TestAttempt → TestAnswer | One-to-Many | Each attempt has one answer per question |
| TestAttempt → TestResult | One-to-One | Each completed attempt yields exactly one result |
| Question → TestAnswer | One-to-Many | A question can be answered in many different attempts |
