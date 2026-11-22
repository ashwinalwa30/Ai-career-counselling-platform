# Sample Records – PathFinder AI Career Counselling Platform

This document shows representative sample data for each table in the database. These records are either seeded via `backend/prisma/seed.js` or represent data created during typical application usage.

---

## 1. User

```sql
INSERT INTO "User" (
  id, "fullName", email, "passwordHash", phone, "class", board,
  "schoolName", state, "preferredLanguage", interests, dob, "subjectMarks"
) VALUES
(
  'clx1a2b3c4d5e6f7g8h9',
  'Priya Sharma',
  'priya.sharma@example.com',
  '$2b$12$hashedpassword1234567890abcdef',
  '9876543210',
  '11',
  'CBSE',
  'Delhi Public School',
  'Delhi',
  'English',
  ARRAY['Technology', 'Science', 'Problem Solving'],
  '2008-05-14',
  '{"Physics": 88, "Chemistry": 82, "Mathematics": 91}'
),
(
  'clx2b3c4d5e6f7g8h9i0',
  'Arjun Mehta',
  'arjun.mehta@example.com',
  '$2b$12$hashedpassword0987654321zyxwvut',
  '9123456789',
  '12',
  'ICSE',
  'St. Xavier''s High School',
  'Maharashtra',
  'English',
  ARRAY['Arts', 'Music', 'Design'],
  '2007-11-22',
  '{"English": 92, "History": 87, "Geography": 85}'
),
(
  'clx3c4d5e6f7g8h9i0j1',
  'Kavya Reddy',
  'kavya.reddy@example.com',
  '$2b$12$hashedpassword1122334455667788',
  NULL,
  '10',
  'State Board',
  'Govt. High School',
  'Telangana',
  'Telugu',
  ARRAY['Biology', 'Medicine'],
  '2009-03-08',
  '{"Biology": 95, "Chemistry": 89, "Physics": 76}'
);
```

---

## 2. Session

```sql
INSERT INTO "Session" (id, "tokenHash", "userId", "expiresAt", "revokedAt") VALUES
(
  'sess_clx1a2b3c001',
  'sha256_abc123def456ghi789jkl012mno345pqr678stu901vwx234',
  'clx1a2b3c4d5e6f7g8h9',
  '2026-12-22 15:20:00',
  NULL
),
(
  'sess_clx2b3c4d002',
  'sha256_xyz987wvu654tsr321qpo098nml765kji432hgf109edc876',
  'clx2b3c4d5e6f7g8h9i0',
  '2026-11-30 10:00:00',
  '2026-11-20 08:30:00'   -- revoked (logout)
),
(
  'sess_clx3c4d5e003',
  'sha256_lmn456opq789rst012uvw345xyz678abc901def234ghi567',
  'clx3c4d5e6f7g8h9i0j1',
  '2026-12-22 15:20:00',
  NULL
);
```

---

## 3. TestSection

```sql
INSERT INTO "TestSection" (id, label, description, "questionCount", type) VALUES
('logical_reasoning',  'Logical Reasoning',  'Tests ability to reason through patterns, sequences and relationships.', 6,  'cognitive'),
('numerical_ability',  'Numerical Ability',  'Tests arithmetic, percentages, ratios and basic mathematical problem-solving.', 6, 'cognitive'),
('verbal_ability',     'Verbal Ability',     'Tests command of English — vocabulary, grammar and reading comprehension.', 6, 'cognitive'),
('spatial_reasoning',  'Spatial Reasoning',  'Tests ability to visualise shapes, patterns and objects in space.', 6, 'cognitive'),
('interest_profile',   'Interest Profile',   'No right or wrong answers — just pick what genuinely appeals to you most.', 12, 'interest');
```

---

## 4. Question

```sql
INSERT INTO "Question" (id, "sectionId", question, options, "correctAnswer", difficulty) VALUES
(
  'lr_01',
  'logical_reasoning',
  'What comes next in the number series: 3, 6, 11, 18, 27, ?',
  '["36","38","40","42"]',
  '38',
  'easy'
),
(
  'lr_02',
  'logical_reasoning',
  'Doctor is to Hospital as Teacher is to _____.',
  '["Library","School","Book","Student"]',
  'School',
  'easy'
),
(
  'na_01',
  'numerical_ability',
  'If 15% of a number is 45, what is the number?',
  '["250","300","350","400"]',
  '300',
  'easy'
),
(
  'ip_01',
  'interest_profile',
  'Which activity appeals to you the most?',
  '[{"text":"Designing a website"},{"text":"Conducting a science experiment"},{"text":"Writing a short story"},{"text":"Solving a maths puzzle"}]',
  NULL,
  'interest'
);
```

---

## 5. Career

```sql
INSERT INTO "Career" (id, title, stream, icon, description, "riasecTypes", "requiredAptitudes", details) VALUES
(
  'software_engineer',
  'Software Engineer',
  'Technology',
  '💻',
  'Designs, builds and maintains software systems and applications.',
  ARRAY['Investigative', 'Realistic'],
  ARRAY['logical_reasoning', 'numerical_ability'],
  '{
    "title": "Software Engineer",
    "salary": {
      "entry": {"min": 500000, "max": 1200000},
      "mid":   {"min": 1200000,"max": 2500000},
      "senior":{"min": 2500000,"max": 6000000}
    },
    "topColleges": ["IIT Bombay","NIT Trichy","BITS Pilani","VIT"],
    "entranceExams": ["JEE Advanced","JEE Main","BITSAT"],
    "roadmap": ["Class 11-12 PCM","B.Tech CSE","Internships","Campus Placement"]
  }'
),
(
  'doctor_mbbs',
  'Doctor (MBBS)',
  'Medical',
  '🩺',
  'Diagnoses and treats patients, prescribes medication and coordinates medical care.',
  ARRAY['Social','Investigative'],
  ARRAY['numerical_ability','verbal_ability'],
  '{
    "title": "Doctor (MBBS)",
    "salary": {
      "entry": {"min": 600000, "max": 1000000},
      "mid":   {"min": 1000000,"max": 2000000},
      "senior":{"min": 2000000,"max": 5000000}
    },
    "topColleges": ["AIIMS Delhi","CMC Vellore","JIPMER Puducherry"],
    "entranceExams": ["NEET-UG"],
    "roadmap": ["Class 11-12 PCB","NEET Prep","MBBS (5.5 years)","Internship","PG (optional)"]
  }'
);
```

---

## 6. TestAttempt

```sql
INSERT INTO "TestAttempt" (id, "userId", status, "questionsAnswered", "startedAt", "completedAt") VALUES
(
  'attempt_clx1_001',
  'clx1a2b3c4d5e6f7g8h9',
  'COMPLETED',
  36,
  '2026-11-20 10:00:00',
  '2026-11-20 10:42:00'
),
(
  'attempt_clx2_001',
  'clx2b3c4d5e6f7g8h9i0',
  'IN_PROGRESS',
  12,
  '2026-11-22 09:15:00',
  NULL
),
(
  'attempt_clx3_001',
  'clx3c4d5e6f7g8h9i0j1',
  'COMPLETED',
  36,
  '2026-11-18 14:00:00',
  '2026-11-18 14:55:00'
);
```

---

## 7. TestAnswer

```sql
INSERT INTO "TestAnswer" (id, "attemptId", "questionId", "selectedOption", "isCorrect") VALUES
('ans_001', 'attempt_clx1_001', 'lr_01', '38',    TRUE),
('ans_002', 'attempt_clx1_001', 'lr_02', 'School', TRUE),
('ans_003', 'attempt_clx1_001', 'na_01', '300',   TRUE),
('ans_004', 'attempt_clx1_001', 'ip_01', 'Solving a maths puzzle', NULL),  -- interest, no right/wrong
('ans_005', 'attempt_clx2_001', 'lr_01', '36',    FALSE),
('ans_006', 'attempt_clx2_001', 'lr_02', 'Library', FALSE),
('ans_007', 'attempt_clx3_001', 'lr_01', '38',    TRUE),
('ans_008', 'attempt_clx3_001', 'na_01', '350',   FALSE);
```

---

## 8. TestResult

```sql
INSERT INTO "TestResult" (
  id, "attemptId", "overallScore",
  "sectionScores", "riasecScores",
  "topTypes", strengths, weaknesses, "completedAt"
) VALUES
(
  'result_001',
  'attempt_clx1_001',
  78,
  '{"logical_reasoning":83,"numerical_ability":80,"verbal_ability":75,"spatial_reasoning":70,"interest_profile":100}',
  '{"Realistic":4,"Investigative":5,"Artistic":2,"Social":1,"Enterprising":2,"Conventional":3}',
  ARRAY['Investigative','Realistic'],
  ARRAY['Logical Reasoning','Numerical Ability'],
  ARRAY['Spatial Reasoning'],
  '2026-11-20 10:42:00'
),
(
  'result_002',
  'attempt_clx3_001',
  65,
  '{"logical_reasoning":60,"numerical_ability":70,"verbal_ability":65,"spatial_reasoning":55,"interest_profile":100}',
  '{"Realistic":2,"Investigative":5,"Artistic":1,"Social":4,"Enterprising":1,"Conventional":2}',
  ARRAY['Investigative','Social'],
  ARRAY['Numerical Ability'],
  ARRAY['Spatial Reasoning','Logical Reasoning'],
  '2026-11-18 14:55:00'
);
```

---

## 9. ChatMessage

```sql
INSERT INTO "ChatMessage" (id, "userId", role, content, "createdAt") VALUES
(
  'chat_001',
  'clx1a2b3c4d5e6f7g8h9',
  'student',
  'What career options are best suited for a PCM student who loves coding?',
  '2026-11-20 11:00:00'
),
(
  'chat_002',
  'clx1a2b3c4d5e6f7g8h9',
  'counsellor',
  'Based on your aptitude results (78/100) and strong Investigative RIASEC profile, here are top options: **Software Engineer**, **Data Scientist**, **AI/ML Engineer**. For Software Engineering, focus on JEE Main/Advanced for IIT/NIT admission into B.Tech CSE.',
  '2026-11-20 11:00:05'
),
(
  'chat_003',
  'clx3c4d5e6f7g8h9i0j1',
  'student',
  'I want to become a doctor. What score do I need in NEET?',
  '2026-11-18 15:00:00'
),
(
  'chat_004',
  'clx3c4d5e6f7g8h9i0j1',
  'counsellor',
  'For MBBS at a government college, you need **600+ out of 720** in NEET-UG. For AIIMS Delhi, aim for **98+ percentile**. Focus on Biology, Chemistry and Physics from your Class 11-12 PCB stream.',
  '2026-11-18 15:00:06'
);
```
