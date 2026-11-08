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

// ── Top career matches ────────────────────────────────────────────────────────
/*
  These are the top 3 results from the aptitude test.
  They are shown blurred on the dashboard until the test is completed.
*/
const TOP_CAREER_MATCHES = [
  {
    id:          'ux-designer',
    title:       'UX / Product Designer',
    stream:      'Design & Technology',
    matchPct:    92,
    icon:        '🎨',
    description: 'Create digital experiences that are both beautiful and easy to use.',
    tags:        ['Creative', 'Technical', 'High demand'],
  },
  {
    id:          'software-engineer',
    title:       'Software Engineer',
    stream:      'Engineering & Technology',
    matchPct:    87,
    icon:        '💻',
    description: 'Build the software and systems that power modern life.',
    tags:        ['Logical', 'Problem-solving', 'Well-paid'],
  },
  {
    id:          'data-analyst',
    title:       'Data Analyst',
    stream:      'Science & Analytics',
    matchPct:    81,
    icon:        '📊',
    description: 'Turn raw numbers into insights that help organisations make decisions.',
    tags:        ['Analytical', 'Growing field', 'Versatile'],
  },
]

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

// ── Daily career facts ────────────────────────────────────────────────────────
/*
  One fact is shown per day — we pick today's by using the day-of-year as an index.
  Writing 10 facts covers every possible day of the week rotation comfortably.
*/
const CAREER_FACTS = [
  {
    fact:   'India will need 1 crore+ cybersecurity professionals by 2030, but currently has only a fraction of that.',
    source: 'NASSCOM, 2023',
  },
  {
    fact:   'UX design roles in India grew by 40% in 2023, driven by rapid growth in fintech and edtech.',
    source: 'LinkedIn India Jobs Report',
  },
  {
    fact:   'The average starting salary for a data scientist in India is ₹8–12 LPA, rising steeply with experience.',
    source: 'AmbitionBox, 2024',
  },
  {
    fact:   'Doctors in rural India are 8× more impactful per capita than those in metro cities, says a WHO study.',
    source: 'WHO India Report',
  },
  {
    fact:   'Animation and VFX is a ₹1,500 crore industry in India, projected to triple by 2027.',
    source: 'FICCI-EY M&E Report',
  },
  {
    fact:   'Class 12 students who talk to a career counsellor are 2× more likely to choose a satisfying career.',
    source: 'UNICEF Education Study',
  },
  {
    fact:   'The Indian EdTech sector has created over 50,000 jobs — many of which didn\'t exist a decade ago.',
    source: 'IBEF Report, 2024',
  },
  {
    fact:   'Environmental science and sustainability careers are growing 15% faster than the overall job market.',
    source: 'Ministry of Environment, 2023',
  },
  {
    fact:   'More than 60% of today\'s Class 8 students will work in jobs that do not exist yet.',
    source: 'World Economic Forum',
  },
  {
    fact:   'India produces the second-largest number of STEM graduates in the world after China.',
    source: 'UNESCO Science Report',
  },
]

export { PROFILE_COMPLETION, TEST_STATUS, TOP_CAREER_MATCHES, NEXT_STEPS, CAREER_FACTS }
