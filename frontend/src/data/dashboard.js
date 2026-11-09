/*
  dashboard.js — mock data for the student dashboard.
  Shaped exactly as the real API would return it, keyed by userId.
  When the backend is ready, api.js will replace these with real fetch calls.
*/

// ── Profile completion ────────────────────────────────────────────────────────
/*
  Each item has a 'done' flag. The percentage is derived in api.js by counting
  done items so components never have to re-compute it.
*/
const PROFILE_COMPLETION = {
  percentage: 60,
  items: [
    { id: 'basic',     label: 'Basic info',         done: true  },
    { id: 'school',    label: 'School details',      done: true  },
    { id: 'interests', label: 'Interests selected',  done: true  },
    { id: 'photo',     label: 'Profile photo',       done: false },
    { id: 'test',      label: 'Aptitude test taken', done: false },
  ],
}

// ── Aptitude test state ───────────────────────────────────────────────────────
/*
  status: "not_started" | "in_progress" | "completed"
  When in_progress, questionsAnswered tells us how far along they are.
*/
const TEST_STATUS = {
  status:            'not_started',
  totalQuestions:    40,
  questionsAnswered: 0,
  completedAt:       null,
}

// ── Next-steps checklist ──────────────────────────────────────────────────────
/*
  A short action list for the student. 'done' is updated locally on the dashboard
  (and would sync to the server in production).
*/
const NEXT_STEPS = [
  { id: 'ns_1', text: 'Complete your profile',              done: false },
  { id: 'ns_2', text: 'Take the aptitude test',             done: false },
  { id: 'ns_3', text: 'Review your top career matches',     done: false },
  { id: 'ns_4', text: 'Explore a career roadmap',           done: false },
  { id: 'ns_5', text: 'Chat with the AI counsellor',        done: false },
]

// ── Daily career tips ─────────────────────────────────────────────────────────
/*
  One tip is shown per day — we pick today's by using the day-of-year as an index.
  These are general, factual career guidance tips that do not require a citation.
*/
const CAREER_FACTS = [
  {
    fact:   'CUET is now the common entrance test for most central universities in India — one application covers many colleges.',
  },
  {
    fact:   'JEE Main is conducted multiple times a year. Only your best score is considered for the final merit list.',
  },
  {
    fact:   'NEET is the single entrance exam for all MBBS and BDS programmes at government and private medical colleges.',
  },
  {
    fact:   'Commerce with Mathematics opens doors to both finance and economics degrees as well as some engineering-adjacent fields.',
  },
  {
    fact:   'Skills like coding, graphic design, and content writing can be built through self-study and do not always require a formal degree.',
  },
  {
    fact:   'Internships and personal projects carry significant weight when applying for jobs in design, media, and technology.',
  },
  {
    fact:   'India has over 1,000 universities — exploring different options early gives you more choices at admission time.',
  },
  {
    fact:   'Board exam scores matter most for direct state counselling admissions; entrance exams like JEE weigh them differently.',
  },
  {
    fact:   'Taking an aptitude test helps identify career areas that match your natural strengths and learning style.',
  },
  {
    fact:   'Many students who switch careers later say they wish they had explored more options before choosing their Class 11 stream.',
  },
]

export { PROFILE_COMPLETION, TEST_STATUS, NEXT_STEPS, CAREER_FACTS }
