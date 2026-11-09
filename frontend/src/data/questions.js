/*
  questions.js — the full aptitude test question bank.

  Four cognitive sections (Logical Reasoning, Numerical Ability, Verbal Ability,
  Spatial Reasoning) have 6 questions each with a correctAnswer.

  The Interest Profile section has 12 questions based on the RIASEC model.
  Each option carries a riasecType instead of a correct answer — there is no
  right or wrong answer in this section.

  RIASEC key:
    R = Realistic      (practical, hands-on, tools / machines)
    I = Investigative  (analytical, scientific, intellectual)
    A = Artistic       (creative, expressive, design)
    S = Social         (helping people, teaching, counselling)
    E = Enterprising   (leadership, business, persuasion)
    C = Conventional   (organised, structured, data-driven)

  Components never import this file directly — always go through api.getQuestions().
*/

// ── Section metadata ──────────────────────────────────────────────────────────
/*
  SECTIONS — used by the instructions page and the test header tabs.
  'type' distinguishes scoring logic: cognitive sections have a right answer,
  the interest section uses RIASEC tallying.
*/
export const SECTIONS = [
  {
    id:            'logical_reasoning',
    label:         'Logical Reasoning',
    questionCount: 6,
    type:          'cognitive',
    description:   'Tests your ability to reason through patterns, sequences and relationships.',
  },
  {
    id:            'numerical_ability',
    label:         'Numerical Ability',
    questionCount: 6,
    type:          'cognitive',
    description:   'Tests arithmetic, percentages, ratios and basic mathematical problem-solving.',
  },
  {
    id:            'verbal_ability',
    label:         'Verbal Ability',
    questionCount: 6,
    type:          'cognitive',
    description:   'Tests your command of English — vocabulary, grammar and reading comprehension.',
  },
  {
    id:            'spatial_reasoning',
    label:         'Spatial Reasoning',
    questionCount: 6,
    type:          'cognitive',
    description:   'Tests your ability to visualise shapes, patterns and objects in space.',
  },
  {
    id:            'interest_profile',
    label:         'Interest Profile',
    questionCount: 12,
    type:          'interest',
    description:   'No right or wrong answers — just pick what genuinely appeals to you most.',
  },
]

// ── Question bank ─────────────────────────────────────────────────────────────
const QUESTIONS = [

  // ══ LOGICAL REASONING ════════════════════════════════════════════════════════

  {
    id:            'lr_01',
    section:       'logical_reasoning',
    question:      'What comes next in the number series: 3, 6, 11, 18, 27, ?',
    options:       ['36', '38', '40', '42'],
    correctAnswer: '38',          // differences increase by 2 each time: +3, +5, +7, +9, +11
    difficulty:    'easy',
  },
  {
    id:            'lr_02',
    section:       'logical_reasoning',
    question:      'Doctor is to Hospital as Teacher is to ___.',
    options:       ['Library', 'School', 'Book', 'Student'],
    correctAnswer: 'School',
    difficulty:    'easy',
  },
  {
    id:            'lr_03',
    section:       'logical_reasoning',
    question:      'In a code language, CAT is written as 3-1-20 (using alphabetical position A=1, B=2…). What is the code for DOG?',
    options:       ['4-15-7', '4-14-7', '3-15-7', '4-15-8'],
    correctAnswer: '4-15-7',      // D=4, O=15, G=7
    difficulty:    'medium',
  },
  {
    id:            'lr_04',
    section:       'logical_reasoning',
    question:      'A is the father of B. B is the sister of C. C is the mother of D. How is A related to D?',
    options:       ['Uncle', 'Grandfather', 'Father', 'Great-grandfather'],
    correctAnswer: 'Grandfather',
    difficulty:    'medium',
  },
  {
    id:            'lr_05',
    section:       'logical_reasoning',
    question:      'In a row of students, Riya is 7th from the left and 11th from the right. How many students are in the row?',
    options:       ['16', '17', '18', '19'],
    correctAnswer: '17',          // 7 + 11 − 1 = 17
    difficulty:    'medium',
  },
  {
    id:            'lr_06',
    section:       'logical_reasoning',
    question:      'Aman is taller than Bindu. Chetan is shorter than Aman. No other information is given. Who could be the shortest?',
    options:       ['Only Aman', 'Only Bindu', 'Bindu or Chetan', 'Only Chetan'],
    correctAnswer: 'Bindu or Chetan',  // we know Aman > Bindu and Aman > Chetan, but Bindu vs Chetan is unknown
    difficulty:    'hard',
  },

  // ══ NUMERICAL ABILITY ════════════════════════════════════════════════════════

  {
    id:            'na_01',
    section:       'numerical_ability',
    question:      'A train travels 240 km in 4 hours. What is its average speed?',
    options:       ['50 km/h', '60 km/h', '55 km/h', '65 km/h'],
    correctAnswer: '60 km/h',
    difficulty:    'easy',
  },
  {
    id:            'na_02',
    section:       'numerical_ability',
    question:      'A shopkeeper bought 50 pens for ₹200 and sold them all for ₹250. What is the profit percentage?',
    options:       ['20%', '25%', '30%', '15%'],
    correctAnswer: '25%',         // profit = ₹50; 50/200 × 100 = 25%
    difficulty:    'easy',
  },
  {
    id:            'na_03',
    section:       'numerical_ability',
    question:      'The ratio of boys to girls in a class is 3:2. If there are 30 students in total, how many are girls?',
    options:       ['10', '12', '15', '18'],
    correctAnswer: '12',          // girls = (2/5) × 30 = 12
    difficulty:    'medium',
  },
  {
    id:            'na_04',
    section:       'numerical_ability',
    question:      'Find the simple interest on ₹5,000 at 8% per annum for 3 years.',
    options:       ['₹1,000', '₹1,200', '₹1,500', '₹1,800'],
    correctAnswer: '₹1,200',      // SI = P×R×T/100 = 5000×8×3/100 = ₹1,200
    difficulty:    'medium',
  },
  {
    id:            'na_05',
    section:       'numerical_ability',
    question:      'A mobile phone is sold at ₹12,000 after a 20% discount. What was the original price?',
    options:       ['₹14,000', '₹14,400', '₹15,000', '₹16,000'],
    correctAnswer: '₹15,000',     // 12000 / 0.80 = ₹15,000
    difficulty:    'medium',
  },
  {
    id:            'na_06',
    section:       'numerical_ability',
    question:      'A can complete a task in 10 days and B in 15 days. How many days will they take working together?',
    options:       ['5 days', '6 days', '7 days', '8 days'],
    correctAnswer: '6 days',      // combined rate = 1/10 + 1/15 = 1/6, so 6 days
    difficulty:    'hard',
  },

  // ══ VERBAL ABILITY ═══════════════════════════════════════════════════════════

  {
    id:            'va_01',
    section:       'verbal_ability',
    question:      'Choose the word closest in meaning to BENEVOLENT:',
    options:       ['Cruel', 'Kind', 'Brave', 'Lazy'],
    correctAnswer: 'Kind',
    difficulty:    'easy',
  },
  {
    id:            'va_02',
    section:       'verbal_ability',
    question:      'Choose the word most opposite in meaning to EXPAND:',
    options:       ['Increase', 'Contract', 'Extend', 'Develop'],
    correctAnswer: 'Contract',
    difficulty:    'easy',
  },
  {
    id:            'va_03',
    section:       'verbal_ability',
    question:      'Fill in the blank: "The scientist\'s discovery was ______ — no one had ever thought of it before."',
    options:       ['ordinary', 'revolutionary', 'familiar', 'expected'],
    correctAnswer: 'revolutionary',
    difficulty:    'medium',
  },
  {
    id:            'va_04',
    section:       'verbal_ability',
    question:      'A person who travels to a holy place as an act of religious devotion is called a:',
    options:       ['Nomad', 'Pilgrim', 'Refugee', 'Wanderer'],
    correctAnswer: 'Pilgrim',
    difficulty:    'medium',
  },
  {
    id:            'va_05',
    section:       'verbal_ability',
    question:      'Which sentence is grammatically correct?',
    options:       [
      'She is more smarter than her brother.',
      'She is smarter than her brother.',
      'She is the most smart than her brother.',
      'She is most smarter than her brother.',
    ],
    correctAnswer: 'She is smarter than her brother.',
    difficulty:    'medium',
  },
  {
    id:            'va_06',
    section:       'verbal_ability',
    question:      'What does the idiom "bite the bullet" mean?',
    options:       [
      'To eat something very hard',
      'To endure a painful situation bravely',
      'To speak harshly to someone',
      'To make a costly mistake',
    ],
    correctAnswer: 'To endure a painful situation bravely',
    difficulty:    'medium',
  },

  // ══ SPATIAL REASONING ════════════════════════════════════════════════════════

  {
    id:            'sr_01',
    section:       'spatial_reasoning',
    question:      'A clock shows 3:15. What time does its mirror image show?',
    options:       ['8:45', '9:45', '8:15', '9:15'],
    correctAnswer: '8:45',        // mirror formula: 11:60 − 3:15 = 8:45
    difficulty:    'medium',
  },
  {
    id:            'sr_02',
    section:       'spatial_reasoning',
    question:      'A solid cube is painted red on all 6 faces, then cut into 27 equal smaller cubes. How many small cubes have no painted face at all?',
    options:       ['1', '6', '8', '12'],
    correctAnswer: '1',           // only the single centre cube is untouched
    difficulty:    'easy',
  },
  {
    id:            'sr_03',
    section:       'spatial_reasoning',
    question:      'A square piece of paper is folded in half, then folded in half again (perpendicular to the first fold). A hole is punched through all layers. When fully unfolded, how many holes are there?',
    options:       ['1', '2', '4', '8'],
    correctAnswer: '4',
    difficulty:    'medium',
  },
  {
    id:            'sr_04',
    section:       'spatial_reasoning',
    question:      'On a standard die, opposite faces always add up to 7. If the face showing 2 is on top, what number is on the bottom?',
    options:       ['3', '4', '5', '6'],
    correctAnswer: '5',           // 2 + 5 = 7
    difficulty:    'easy',
  },
  {
    id:            'sr_05',
    section:       'spatial_reasoning',
    question:      'You are facing North. You turn 90° clockwise, then 180° anti-clockwise. Which direction are you now facing?',
    options:       ['North', 'South', 'East', 'West'],
    correctAnswer: 'West',        // North → East (90° CW) → West (180° ACW)
    difficulty:    'medium',
  },
  {
    id:            'sr_06',
    section:       'spatial_reasoning',
    question:      'A pattern repeats: Circle, Triangle, Square, Circle, Triangle, Square, … What is the 25th shape?',
    options:       ['Circle', 'Triangle', 'Square', 'Pentagon'],
    correctAnswer: 'Circle',      // 25 ÷ 3 = 8 remainder 1 → position 1 = Circle
    difficulty:    'hard',
  },

  // ══ INTEREST PROFILE (RIASEC) ════════════════════════════════════════════════
  // No correct answers — each option maps to one RIASEC personality type.

  {
    id:            'ip_01',
    section:       'interest_profile',
    question:      'Which school subject do you enjoy the most?',
    options: [
      { text: 'Workshop or Technical Education',  riasecType: 'R' },
      { text: 'Biology or Chemistry',             riasecType: 'I' },
      { text: 'Art, Music or Drama',              riasecType: 'A' },
      { text: 'History or Social Studies',        riasecType: 'S' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_02',
    section:       'interest_profile',
    question:      'Which after-school activity sounds most enjoyable to you?',
    options: [
      { text: 'Running for school council president',           riasecType: 'E' },
      { text: 'Organising and cataloguing the school library',  riasecType: 'C' },
      { text: 'Building or repairing a gadget',                 riasecType: 'R' },
      { text: 'Doing science experiments at home',              riasecType: 'I' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_03',
    section:       'interest_profile',
    question:      'Which type of job sounds most fulfilling to you?',
    options: [
      { text: 'Graphic designer or filmmaker',     riasecType: 'A' },
      { text: 'Counsellor or social worker',       riasecType: 'S' },
      { text: 'Entrepreneur or business manager',  riasecType: 'E' },
      { text: 'Accountant or financial analyst',   riasecType: 'C' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_04',
    section:       'interest_profile',
    question:      'How do you most enjoy spending a free afternoon?',
    options: [
      { text: 'Building or fixing something with your hands',  riasecType: 'R' },
      { text: 'Reading about how things work',                 riasecType: 'I' },
      { text: 'Drawing, writing or making music',              riasecType: 'A' },
      { text: 'Volunteering or helping a neighbour',           riasecType: 'S' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_05',
    section:       'interest_profile',
    question:      'Your friends would most likely describe you as:',
    options: [
      { text: 'A natural leader who motivates others',    riasecType: 'E' },
      { text: 'Very organised and detail-oriented',       riasecType: 'C' },
      { text: 'Practical and good with your hands',       riasecType: 'R' },
      { text: 'Curious and always asking "why?"',         riasecType: 'I' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_06',
    section:       'interest_profile',
    question:      'Which career path excites you the most?',
    options: [
      { text: 'Architect or film director',       riasecType: 'A' },
      { text: 'Doctor or schoolteacher',          riasecType: 'S' },
      { text: 'Company founder or sales leader',  riasecType: 'E' },
      { text: 'Civil servant or bank officer',    riasecType: 'C' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_07',
    section:       'interest_profile',
    question:      'Which school project would you enjoy the most?',
    options: [
      { text: 'Making a working model of a machine',          riasecType: 'R' },
      { text: 'Researching and writing a scientific report',  riasecType: 'I' },
      { text: 'Creating an illustrated class magazine',       riasecType: 'A' },
      { text: 'Organising a fundraiser for a good cause',     riasecType: 'S' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_08',
    section:       'interest_profile',
    question:      'You feel most proud when you:',
    options: [
      { text: 'Convince others to support your idea',          riasecType: 'E' },
      { text: 'Complete a task perfectly and on time',         riasecType: 'C' },
      { text: 'Fix a complicated problem with your hands',     riasecType: 'R' },
      { text: 'Figure out the answer to a difficult puzzle',   riasecType: 'I' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_09',
    section:       'interest_profile',
    question:      'Which skill would you most like to develop?',
    options: [
      { text: 'Creative writing or photography',       riasecType: 'A' },
      { text: 'Listening carefully and giving advice', riasecType: 'S' },
      { text: 'Public speaking and negotiation',       riasecType: 'E' },
      { text: 'Data analysis and financial planning',  riasecType: 'C' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_10',
    section:       'interest_profile',
    question:      'Your ideal work environment is:',
    options: [
      { text: 'A workshop, construction site or outdoor field',  riasecType: 'R' },
      { text: 'A research laboratory or university',             riasecType: 'I' },
      { text: 'A design studio, gallery or theatre stage',       riasecType: 'A' },
      { text: 'A classroom, clinic or community centre',         riasecType: 'S' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_11',
    section:       'interest_profile',
    question:      'Which challenge would you tackle most enthusiastically?',
    options: [
      { text: 'Pitching a startup idea to investors',      riasecType: 'E' },
      { text: 'Creating a detailed plan for a large event', riasecType: 'C' },
      { text: 'Diagnosing why a machine stopped working',  riasecType: 'R' },
      { text: 'Designing an experiment to test a theory',  riasecType: 'I' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
  {
    id:            'ip_12',
    section:       'interest_profile',
    question:      'Which best describes your ideal future?',
    options: [
      { text: 'Creating art or design that moves people',       riasecType: 'A' },
      { text: "Making a real difference in people's lives",     riasecType: 'S' },
      { text: 'Leading a successful organisation',              riasecType: 'E' },
      { text: 'Working in a stable, well-structured role',      riasecType: 'C' },
    ],
    correctAnswer: null,
    difficulty:    'n/a',
  },
]

export default QUESTIONS
