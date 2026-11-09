/*
  careers.js — static career data for the PathFinder career explorer.
  Each career represents a realistic path available to Indian secondary
  school students (Class 8–12).

  Shape of each entry:
    id               — unique slug (used in URLs and cross-references)
    title            — display name
    stream           — broad category used for filter chips
    icon             — single emoji
    description      — 1–2 sentence overview shown on the card
    riasecTypes      — 2 primary Holland types that suit this career
    requiredAptitudes— 2 aptitude section ids most relevant to this career
    skills           — 5 key competencies
    salary           — INR ranges at entry / mid / senior level (whole numbers)
    entranceExams    — key exams with name + short one-line description
    topColleges      — 5 well-known Indian institutions
    roadmap          — 7 milestones from Class 10 to growth
    dayInTheLife     — 2–3 sentences describing a typical workday
    futureOutlook    — 2–3 sentences on job market and trends
    relatedCareers   — 2–3 career ids with similar profiles
*/

const CAREERS = [
  // ── Technology ──────────────────────────────────────────────────────────────

  {
    id:          'software_engineer',
    title:       'Software Engineer',
    stream:      'Technology',
    icon:        '💻',
    description: 'Software engineers design, build and maintain applications and systems that power the digital world. It is one of the most in-demand and well-paying careers in India and globally.',
    riasecTypes:       ['I', 'C'],
    requiredAptitudes: ['logical_reasoning', 'numerical_ability'],
    skills: ['Programming', 'Problem Solving', 'Data Structures', 'System Design', 'Teamwork'],
    salary: {
      entry:  { min: 400000,  max: 800000  },
      mid:    { min: 1200000, max: 2500000 },
      senior: { min: 3000000, max: 6000000 },
    },
    entranceExams: [
      { name: 'JEE Main',    desc: 'Gateway to NITs, IIITs and CFTIs for B.Tech admission' },
      { name: 'JEE Advanced', desc: 'Gateway to IITs — requires JEE Main qualification' },
      { name: 'CUET',        desc: 'Central Universities Common Entrance Test' },
      { name: 'State CETs',  desc: 'State-level engineering exams (MHT-CET, KCET, TSEAMCET, etc.)' },
    ],
    topColleges: ['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'BITS Pilani', 'NIT Trichy'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Build the foundation',    desc: 'Strengthen Maths and Science. Score well in boards to keep PCM options open.' },
      { step: 2, stage: 'Stream',        title: 'Science with Maths (PCM)', desc: 'Choose Physics, Chemistry and Maths. Begin learning Python or C++ alongside school.' },
      { step: 3, stage: 'Class 11–12',   title: 'JEE preparation',          desc: 'Study for JEE Main/Advanced in parallel with boards. Focus on Maths and Physics problem-solving.' },
      { step: 4, stage: 'Entrance Exam', title: 'JEE Main / Advanced',      desc: 'Clear JEE Main for NITs and IIITs. Top rankers can qualify JEE Advanced for IIT admission.' },
      { step: 5, stage: 'Degree',        title: 'B.Tech / B.E. (4 years)',  desc: 'Complete a Bachelor\'s in Computer Science or IT. Intern at tech companies in year 3.' },
      { step: 6, stage: 'First Job',     title: 'Junior Software Developer', desc: 'Join a startup, IT services company or product firm. Build real-world experience through projects.' },
      { step: 7, stage: 'Growth',        title: 'Senior Engineer / Architect', desc: 'Progress to tech lead, architect or engineering manager. Specialise in AI, cloud or DevOps for top packages.' },
    ],
    dayInTheLife: 'The day starts with a team standup to discuss progress and blockers. Most of the morning is spent writing, reviewing and debugging code. Afternoons involve design discussions, code reviews or mentoring junior colleagues.',
    futureOutlook: 'Software engineering is one of the fastest-growing fields in India and globally. Cloud, AI/ML and cybersecurity are creating millions of new roles every year. Demand for skilled engineers far outpaces supply, keeping salaries high.',
    relatedCareers: ['data_scientist', 'game_developer', 'entrepreneur'],
  },

  {
    id:          'data_scientist',
    title:       'Data Scientist',
    stream:      'Technology',
    icon:        '📊',
    description: 'Data scientists extract insights from large datasets using statistics, machine learning and programming to help organisations make smarter decisions.',
    riasecTypes:       ['I', 'C'],
    requiredAptitudes: ['numerical_ability', 'logical_reasoning'],
    skills: ['Statistics', 'Python / R', 'Machine Learning', 'Data Visualisation', 'SQL'],
    salary: {
      entry:  { min: 500000,  max: 1000000 },
      mid:    { min: 1500000, max: 3000000 },
      senior: { min: 3500000, max: 7000000 },
    },
    entranceExams: [
      { name: 'JEE Main / Advanced', desc: 'For B.Tech CS/Maths at IITs and NITs' },
      { name: 'CUET',                desc: 'For BSc Statistics / Maths at central universities' },
      { name: 'GATE',                desc: 'For M.Tech or direct PhD in CS / Data Science' },
      { name: 'CAT / GMAT',         desc: 'For MBA in Business Analytics at IIMs and top B-schools' },
    ],
    topColleges: ['IIT Bombay', 'IIT Kharagpur', 'ISI Kolkata', 'CMI Chennai', 'IIM Bangalore (MBA Analytics)'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Master Maths',             desc: 'Develop a strong base in algebra, statistics and logical reasoning.' },
      { step: 2, stage: 'Stream',        title: 'Science or Commerce (Maths)', desc: 'PCM or Commerce with Maths both work. Statistics as an optional subject is a bonus.' },
      { step: 3, stage: 'Class 11–12',   title: 'Self-study Python & Stats', desc: 'Start learning Python and basic probability concepts through free online courses.' },
      { step: 4, stage: 'Entrance Exam', title: 'JEE / CUET / State CET',   desc: 'Enter a B.Tech CS, BSc Statistics, or Mathematics programme at a reputed institution.' },
      { step: 5, stage: 'Degree',        title: 'B.Tech CS / BSc Maths-Stats (3–4 years)', desc: 'Build projects using real datasets. Take electives in ML and databases.' },
      { step: 6, stage: 'First Job',     title: 'Data Analyst / Junior Data Scientist', desc: 'Start in analytics roles at tech or consulting firms. Build a portfolio of Kaggle projects.' },
      { step: 7, stage: 'Growth',        title: 'Lead Data Scientist / AI Researcher', desc: 'Specialise in NLP, computer vision or MLOps. Senior roles at MNCs offer excellent packages.' },
    ],
    dayInTheLife: 'A data scientist starts the day cleaning and exploring datasets, then builds or refines predictive models. The afternoon may involve presenting findings to business stakeholders or writing model documentation. Collaboration with engineers to deploy models is a regular part of the week.',
    futureOutlook: 'Data science is among the highest-growth fields globally. Every industry — healthcare, finance, e-commerce — is investing heavily in data teams. AI automation will shift the focus from routine analysis to complex modelling and interpretability.',
    relatedCareers: ['software_engineer', 'agricultural_scientist', 'chartered_accountant'],
  },

  {
    id:          'game_developer',
    title:       'Game Developer',
    stream:      'Technology',
    icon:        '🎮',
    description: 'Game developers create interactive digital games — from mobile games to console blockbusters — combining programming, design and storytelling skills.',
    riasecTypes:       ['I', 'A'],
    requiredAptitudes: ['logical_reasoning', 'spatial_reasoning'],
    skills: ['C++ / C#', 'Unity or Unreal Engine', '3D Maths', 'Game Design', 'Problem Solving'],
    salary: {
      entry:  { min: 300000,  max: 600000  },
      mid:    { min: 800000,  max: 1800000 },
      senior: { min: 2000000, max: 4500000 },
    },
    entranceExams: [
      { name: 'JEE Main',       desc: 'For B.Tech CS at NITs and IIITs' },
      { name: 'UCEED',          desc: 'Undergraduate Common Entrance Exam for Design — IIT Design courses' },
      { name: 'NID DAT',        desc: 'National Institute of Design Design Aptitude Test' },
      { name: 'College-specific', desc: 'Dedicated game design institutes like ICAT, Backstage Pass, etc.' },
    ],
    topColleges: ['IIT Bombay (IDC)', 'MIT Pune', 'Backstage Pass Hyderabad', 'ICAT Design & Media College', 'Whistling Woods International'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Maths and creativity',       desc: 'Build strong Maths skills and explore drawing, storytelling or music as hobbies.' },
      { step: 2, stage: 'Stream',        title: 'Science with Maths (PCM)',   desc: 'PCM gives access to B.Tech CS. Start building small games in Unity or Godot in free time.' },
      { step: 3, stage: 'Class 11–12',   title: 'Build a game portfolio',     desc: 'Create and share small games on itch.io. Learn 3D maths and C++ programming.' },
      { step: 4, stage: 'Entrance Exam', title: 'JEE Main / Design entrance', desc: 'Enter B.Tech CS for a technical path, or a game/interaction design course through UCEED or NID.' },
      { step: 5, stage: 'Degree',        title: 'B.Tech CS or B.Des (3–4 years)', desc: 'Focus on graphics programming, game engine architecture and capstone game projects.' },
      { step: 6, stage: 'First Job',     title: 'Junior Game Developer',      desc: 'Join a studio as a programmer, artist or designer. Indian mobile gaming studios are very active.' },
      { step: 7, stage: 'Growth',        title: 'Lead Developer / Game Director', desc: 'Lead a team, found an indie studio, or join global AAA studios. India\'s gaming market is growing rapidly.' },
    ],
    dayInTheLife: 'A game developer alternates between writing engine code, tweaking gameplay mechanics and play-testing builds. Stand-ups with artists and designers keep the team aligned. Crunch periods near launch involve long hours polishing features and squashing bugs.',
    futureOutlook: 'India\'s gaming industry is booming, with over 500 million mobile gamers. AR/VR, cloud gaming and esports are creating entirely new roles. Skilled game developers with strong portfolios are increasingly sought by both Indian studios and global remote teams.',
    relatedCareers: ['software_engineer', 'graphic_designer', 'entrepreneur'],
  },

  // ── Medicine & Health ──────────────────────────────────────────────────────

  {
    id:          'doctor',
    title:       'Doctor (MBBS)',
    stream:      'Medicine & Health',
    icon:        '🩺',
    description: 'Doctors diagnose and treat illness, helping patients recover and stay healthy. MBBS is the foundational medical degree in India, opening doors to general practice and specialisation.',
    riasecTypes:       ['I', 'S'],
    requiredAptitudes: ['logical_reasoning', 'verbal_ability'],
    skills: ['Clinical Diagnosis', 'Patient Communication', 'Biology & Chemistry', 'Empathy', 'Decision Making'],
    salary: {
      entry:  { min: 600000,  max: 1200000 },
      mid:    { min: 1500000, max: 3000000 },
      senior: { min: 3000000, max: 8000000 },
    },
    entranceExams: [
      { name: 'NEET-UG', desc: 'The single national entrance test for MBBS and BDS admissions across India' },
    ],
    topColleges: ['AIIMS New Delhi', 'JIPMER Puducherry', 'CMC Vellore', 'Maulana Azad Medical College', 'KEM Hospital Mumbai'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Science foundation',         desc: 'Score well in Science and English. Develop curiosity about Biology and human health.' },
      { step: 2, stage: 'Stream',        title: 'Science (PCB)',               desc: 'Choose Physics, Chemistry and Biology. Consider Maths too — useful for NEET and competitive medicine.' },
      { step: 3, stage: 'Class 11–12',   title: 'NEET preparation',           desc: 'Focus on NCERT Biology and Chemistry thoroughly. Physics problems are also essential for NEET.' },
      { step: 4, stage: 'Entrance Exam', title: 'NEET-UG',                    desc: 'Qualify NEET-UG with a high score for AIIMS or government medical colleges. Competition is intense — prepare for 2 years minimum.' },
      { step: 5, stage: 'Degree',        title: 'MBBS (5.5 years)',           desc: 'Four and a half years of coursework plus a one-year compulsory rotating internship at a hospital.' },
      { step: 6, stage: 'First Job',     title: 'Resident / Medical Officer', desc: 'Work as a Resident Doctor in a hospital or join a government health centre. Appear for PG entrance (NEET-PG) to specialise.' },
      { step: 7, stage: 'Growth',        title: 'Specialist / Surgeon',       desc: 'Specialise through MD / MS (3 years). Senior specialists and surgeons in metro cities earn very well.' },
    ],
    dayInTheLife: 'A doctor\'s day begins with ward rounds — reviewing each admitted patient\'s progress and updating treatment. OPD sessions follow, with 20–50 patient consultations. Evenings may involve emergency calls, medical audits or reading the latest research.',
    futureOutlook: 'Healthcare is one of the most recession-proof careers. India faces a severe doctor shortage — 1 doctor per 1,457 people versus WHO\'s recommended 1:1,000. Telemedicine, AI-assisted diagnostics and rural healthcare expansion are creating new opportunities.',
    relatedCareers: ['physiotherapist', 'psychologist', 'agricultural_scientist'],
  },

  {
    id:          'physiotherapist',
    title:       'Physiotherapist',
    stream:      'Medicine & Health',
    icon:        '🏥',
    description: 'Physiotherapists help patients recover from injuries, surgeries and chronic conditions through exercise, manual therapy and rehabilitation programmes.',
    riasecTypes:       ['S', 'R'],
    requiredAptitudes: ['logical_reasoning', 'verbal_ability'],
    skills: ['Anatomy & Physiology', 'Rehabilitation Techniques', 'Patient Communication', 'Exercise Prescription', 'Empathy'],
    salary: {
      entry:  { min: 250000, max: 500000  },
      mid:    { min: 600000, max: 1200000 },
      senior: { min: 1200000, max: 2800000 },
    },
    entranceExams: [
      { name: 'NEET-UG',        desc: 'Required for admission to BPT at several top government colleges' },
      { name: 'State Entrance Tests', desc: 'State-level health science entrance exams for BPT admission' },
      { name: 'CUET',           desc: 'Some central universities use CUET for allied health programmes' },
    ],
    topColleges: ['AIIMS (BPT)', 'Christian Medical College Vellore', 'SRM Institute of Medical Sciences', 'Manipal College of Health Professions', 'JSS College of Physiotherapy'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Biology focus',              desc: 'Build strong Biology and Chemistry foundations. Physical education helps too.' },
      { step: 2, stage: 'Stream',        title: 'Science (PCB)',               desc: 'Physics, Chemistry and Biology are mandatory for health science programmes.' },
      { step: 3, stage: 'Class 11–12',   title: 'NEET/state exam prep',       desc: 'Prepare for NEET or state health science entrances alongside boards.' },
      { step: 4, stage: 'Entrance Exam', title: 'NEET / State Health Entrance', desc: 'Secure a seat in a BPT programme at a recognized institution.' },
      { step: 5, stage: 'Degree',        title: 'BPT — Bachelor of Physiotherapy (4.5 years)', desc: 'Study musculoskeletal, neurological and cardiopulmonary physiotherapy with 500+ hours of clinical practice.' },
      { step: 6, stage: 'First Job',     title: 'Junior Physiotherapist',     desc: 'Work in a hospital, sports academy or rehabilitation centre. Build clinical experience.' },
      { step: 7, stage: 'Growth',        title: 'Senior PT / Own Clinic',     desc: 'Specialise in sports, paediatrics or neurology. Many experienced PTs open their own clinics.' },
    ],
    dayInTheLife: 'A physiotherapist begins the day assessing new patients — reviewing medical records and conducting movement tests. Treatment sessions follow, involving hands-on manual therapy, guided exercises and electrotherapy. Documentation and care plan updates round off the day.',
    futureOutlook: 'India\'s ageing population and rising sports culture are driving demand for physiotherapists. The fitness and wellness industry is also absorbing PTs in gyms, corporates and sports teams. Tele-physiotherapy is opening remote practice opportunities.',
    relatedCareers: ['doctor', 'psychologist', 'teacher'],
  },

  {
    id:          'psychologist',
    title:       'Psychologist',
    stream:      'Medicine & Health',
    icon:        '🧠',
    description: 'Psychologists study human behaviour and mental processes to help individuals overcome emotional difficulties, improve well-being and lead healthier lives.',
    riasecTypes:       ['S', 'I'],
    requiredAptitudes: ['verbal_ability', 'logical_reasoning'],
    skills: ['Counselling', 'Research Methods', 'Empathy', 'Communication', 'Critical Thinking'],
    salary: {
      entry:  { min: 250000, max: 500000  },
      mid:    { min: 600000, max: 1200000 },
      senior: { min: 1200000, max: 2500000 },
    },
    entranceExams: [
      { name: 'CUET',              desc: 'For BA / BSc Psychology at central universities' },
      { name: 'State university entrance', desc: 'Many state universities conduct their own entrance for psychology programmes' },
      { name: 'DU Entrance Test',  desc: 'Delhi University entrance for BA (Hons) Psychology' },
      { name: 'TISS Entrance',     desc: 'Tata Institute for MA Applied Psychology / Social Work' },
    ],
    topColleges: ['TISS Mumbai', 'Delhi University', 'Christ University Bengaluru', 'Jamia Millia Islamia', 'Fergusson College Pune'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Communication & biology base', desc: 'Develop strong reading habits and interpersonal skills. Biology helps for clinical psychology.' },
      { step: 2, stage: 'Stream',        title: 'Humanities or Science',         desc: 'Humanities (with Psychology as a subject if available) or PCB both lead to psychology degrees.' },
      { step: 3, stage: 'Class 11–12',   title: 'Psychology elective (if available)', desc: 'Take Psychology as an elective where possible. Focus on English and logical reasoning.' },
      { step: 4, stage: 'Entrance Exam', title: 'CUET / DU / TISS',            desc: 'Appear for university-level entrance tests for a BA/BSc Psychology undergraduate programme.' },
      { step: 5, stage: 'Degree',        title: 'BA/BSc Psychology (3 years) + MA/MSc (2 years)', desc: 'A master\'s degree is essential for practice. Focus on clinical, counselling or industrial psychology.' },
      { step: 6, stage: 'First Job',     title: 'Counsellor / Research Associate', desc: 'Work at NGOs, corporates, schools or hospitals. RCI registration required for clinical practice.' },
      { step: 7, stage: 'Growth',        title: 'Licensed Psychologist / Therapist', desc: 'Complete MPhil (Clinical) for RCI licensure. Senior psychologists in metro hospitals earn well.' },
    ],
    dayInTheLife: 'A psychologist typically begins the day reviewing session notes before meeting 4–6 clients for therapy or counselling. Afternoons may involve psychological assessments, report writing or group therapy sessions. Research-track psychologists also spend time analysing data and writing papers.',
    futureOutlook: 'India is facing a mental health crisis — only 0.3 psychiatrists and 0.07 psychologists exist per 100,000 people. Corporates, schools and hospitals are actively hiring. LGBTQ+ affirmative therapy, teletherapy and sports psychology are fast-growing niches.',
    relatedCareers: ['teacher', 'doctor', 'journalist'],
  },

  // ── Finance & Business ───────────────────────────────────────────────────────

  {
    id:          'chartered_accountant',
    title:       'Chartered Accountant',
    stream:      'Finance & Business',
    icon:        '📑',
    description: 'Chartered Accountants manage financial records, auditing, taxation and business advisory services. The CA qualification from ICAI is one of India\'s most prestigious professional degrees.',
    riasecTypes:       ['C', 'E'],
    requiredAptitudes: ['numerical_ability', 'logical_reasoning'],
    skills: ['Accounting', 'Taxation', 'Auditing', 'Financial Analysis', 'Business Law'],
    salary: {
      entry:  { min: 600000,  max: 1000000 },
      mid:    { min: 1200000, max: 2500000 },
      senior: { min: 2500000, max: 5000000 },
    },
    entranceExams: [
      { name: 'CA Foundation', desc: 'Entry-level ICAI exam — can appear after Class 12' },
      { name: 'CA Intermediate', desc: 'Second level — covers accounting, law and taxation' },
      { name: 'CA Final',       desc: 'The qualifying exam for the CA designation' },
      { name: 'CMA Foundation', desc: 'Alternative pathway via Cost and Management Accounting' },
    ],
    topColleges: ['ICAI (All-India)',  'SRCC Delhi', 'Narsee Monjee Mumbai', 'Loyola Chennai', 'Symbiosis Pune'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Maths and accounts base',   desc: 'Score well in Maths. Consider Introduction to Accountancy as a subject if offered.' },
      { step: 2, stage: 'Stream',        title: 'Commerce (with Maths)',      desc: 'Choose Commerce stream. Accountancy and Business Studies are core subjects.' },
      { step: 3, stage: 'Class 11–12',   title: 'CA Foundation registration', desc: 'Register for CA Foundation with ICAI after Class 11. Appear for the exam after Class 12 boards.' },
      { step: 4, stage: 'Entrance Exam', title: 'CA Foundation',              desc: 'Clear all four papers in CA Foundation. This can be done simultaneously with BCom or BBA.' },
      { step: 5, stage: 'Degree',        title: 'BCom + CA Intermediate + 2.5-yr articleship', desc: 'Work under a practising CA during articleship while clearing Intermediate and Final exams.' },
      { step: 6, stage: 'First Job',     title: 'CA in Industry / Practice',  desc: 'Join a Big 4 firm, a corporate finance team, or start your own practice.' },
      { step: 7, stage: 'Growth',        title: 'CFO / Partner / Own Firm',  desc: 'Senior CAs in MNCs reach CFO level. Partners at Big 4 firms earn ₹50 lakh+ annually.' },
    ],
    dayInTheLife: 'A CA\'s day involves reviewing financial statements, attending client meetings and preparing tax filings. Audit season is hectic — long days on-site at client offices reviewing books. Outside busy season, strategic advisory and compliance work fill the schedule.',
    futureOutlook: 'The demand for CAs remains consistently high as India\'s corporate sector grows. GST compliance, international taxation and forensic accounting are creating new specialisations. AI will automate routine bookkeeping but complex advisory roles will only grow.',
    relatedCareers: ['entrepreneur', 'lawyer', 'data_scientist'],
  },

  {
    id:          'entrepreneur',
    title:       'Entrepreneur',
    stream:      'Finance & Business',
    icon:        '🚀',
    description: 'Entrepreneurs identify opportunities, build businesses and create value for customers and society. India\'s startup ecosystem is one of the world\'s largest, offering immense scope.',
    riasecTypes:       ['E', 'A'],
    requiredAptitudes: ['logical_reasoning', 'verbal_ability'],
    skills: ['Business Strategy', 'Leadership', 'Marketing', 'Financial Planning', 'Resilience'],
    salary: {
      entry:  { min: 0,       max: 500000  },
      mid:    { min: 500000,  max: 5000000 },
      senior: { min: 5000000, max: 50000000 },
    },
    entranceExams: [
      { name: 'CAT',    desc: 'Common Admission Test for MBA at IIMs — builds business fundamentals' },
      { name: 'XAT',    desc: 'Xavier Aptitude Test for XLRI and other top B-schools' },
      { name: 'CUET',   desc: 'For BBA / BCom at central universities' },
      { name: 'IPU CET', desc: 'For BBA programmes at Delhi-area universities' },
    ],
    topColleges: ['IIM Ahmedabad', 'IIM Bangalore', 'ISB Hyderabad', 'IIT Madras (BBA)', 'NMIMS Mumbai'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Develop curiosity',         desc: 'Observe businesses around you. Read about successful Indian entrepreneurs and their journeys.' },
      { step: 2, stage: 'Stream',        title: 'Any stream works',           desc: 'Commerce helps with business basics; PCM helps with tech startups; Humanities builds empathy for social ventures.' },
      { step: 3, stage: 'Class 11–12',   title: 'Build your first project',   desc: 'Start something small — a service, product or community. Learning by doing is irreplaceable.' },
      { step: 4, stage: 'Entrance Exam', title: 'CUET / CAT / IPU CET',      desc: 'Enter a BBA or BCom programme, or any degree in your domain of interest.' },
      { step: 5, stage: 'Degree',        title: 'BBA / BCom / BTech (3–4 years)', desc: 'Participate in college incubators, hackathons and startup competitions. Build your network early.' },
      { step: 6, stage: 'First Job',     title: 'Startup founder / Intrepreneur', desc: 'Launch your own venture or join an early-stage startup to learn the ropes quickly.' },
      { step: 7, stage: 'Growth',        title: 'Scale-up / Series Funding',  desc: 'Raise funding, expand the team and scale the product. Pivot when needed. Persistence defines success.' },
    ],
    dayInTheLife: 'An entrepreneur\'s day has no fixed schedule — it shifts between product meetings, investor calls, customer interviews and firefighting. Early-stage founders do everything from coding to sales. The most valuable skill is knowing what to focus on each day.',
    futureOutlook: 'India now has over 100 unicorns and ranks third globally in startup count. Government initiatives like Startup India provide funding and legal support. EdTech, HealthTech, AgriTech and FinTech are the hottest sectors for the next decade.',
    relatedCareers: ['journalist', 'game_developer', 'chartered_accountant'],
  },

  // ── Law ─────────────────────────────────────────────────────────────────────

  {
    id:          'lawyer',
    title:       'Lawyer',
    stream:      'Law',
    icon:        '⚖️',
    description: 'Lawyers advise clients on legal matters, draft contracts, and represent parties in courts and tribunals. It is a career that combines sharp reasoning with the power to shape justice.',
    riasecTypes:       ['E', 'A'],
    requiredAptitudes: ['verbal_ability', 'logical_reasoning'],
    skills: ['Legal Research', 'Argumentation', 'Contract Drafting', 'Critical Thinking', 'Negotiation'],
    salary: {
      entry:  { min: 250000,  max: 600000  },
      mid:    { min: 1000000, max: 2500000 },
      senior: { min: 3000000, max: 15000000 },
    },
    entranceExams: [
      { name: 'CLAT',       desc: 'Common Law Admission Test for National Law Universities — the most prestigious pathway' },
      { name: 'AILET',      desc: 'All India Law Entrance Test for NLU Delhi admission' },
      { name: 'LSAT India', desc: 'Law School Admission Test India — accepted by many private law schools' },
      { name: 'MHT-CET Law', desc: 'Maharashtra state entrance for LLB admissions' },
    ],
    topColleges: ['NLSIU Bangalore', 'NLU Delhi', 'NALSAR Hyderabad', 'NLU Jodhpur', 'Symbiosis Law School Pune'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Communication & logic',      desc: 'Build strong reading, writing and reasoning skills. Debate and essay competitions help.' },
      { step: 2, stage: 'Stream',        title: 'Humanities or any stream',    desc: 'Humanities (History, Political Science, Economics) is ideal but all streams are eligible for law.' },
      { step: 3, stage: 'Class 11–12',   title: 'CLAT preparation',           desc: 'Begin preparing for CLAT — focus on Legal Reasoning, GK and English Comprehension.' },
      { step: 4, stage: 'Entrance Exam', title: 'CLAT / AILET / LSAT',        desc: 'Clear the law entrance to join a 5-year BA LLB or BBA LLB programme at a top NLU.' },
      { step: 5, stage: 'Degree',        title: 'BA LLB / BBA LLB (5 years)', desc: 'Intern at law firms and courts every summer. Moot court participation is essential.' },
      { step: 6, stage: 'First Job',     title: 'Associate at a Law Firm',    desc: 'Join a tier-1 or tier-2 law firm, a corporate legal team or start independent practice after enrolment with Bar Council.' },
      { step: 7, stage: 'Growth',        title: 'Senior Partner / Judge',     desc: 'Senior partners at leading firms earn crores. Judicial services or Senior Advocate designation at the Supreme Court are pinnacle achievements.' },
    ],
    dayInTheLife: 'A lawyer\'s morning involves reading case files, researching precedents and drafting legal documents. Court hearings in the afternoon demand sharp oral arguments under time pressure. Evenings are spent consulting with clients, reviewing contracts or preparing for upcoming hearings.',
    futureOutlook: 'India\'s legal sector is growing rapidly with increasing foreign investment, corporate activity and regulatory complexity. Technology law, intellectual property and arbitration are high-demand specialisations. AI tools are changing legal research but advocacy and strategy remain deeply human.',
    relatedCareers: ['civil_services_ias', 'journalist', 'entrepreneur'],
  },

  // ── Civil Services & Defence ─────────────────────────────────────────────────

  {
    id:          'civil_services_ias',
    title:       'Civil Services (IAS)',
    stream:      'Civil Services',
    icon:        '🏛️',
    description: 'Indian Administrative Service (IAS) officers lead district administration, formulate policy and drive development across India. It is one of the most respected and challenging careers in public service.',
    riasecTypes:       ['S', 'E'],
    requiredAptitudes: ['logical_reasoning', 'verbal_ability'],
    skills: ['Administration', 'Policy Analysis', 'Communication', 'Leadership', 'Problem Solving'],
    salary: {
      entry:  { min: 600000,  max: 900000  },
      mid:    { min: 1000000, max: 1500000 },
      senior: { min: 1500000, max: 2500000 },
    },
    entranceExams: [
      { name: 'UPSC CSE',     desc: 'The Union Public Service Commission Civil Services Examination — 3-stage process: Prelims, Mains, Interview' },
      { name: 'State PCS',    desc: 'State Public Service Commissions for Class A and B state administrative services' },
    ],
    topColleges: ['LBSNAA Mussoorie (Training Academy)', 'JNU New Delhi', 'Delhi University', 'IIT campuses', 'Jawaharlal Nehru University'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Broad reading habits',       desc: 'Read newspapers daily. Build awareness of current affairs, history and geography.' },
      { step: 2, stage: 'Stream',        title: 'Any stream — Humanities preferred', desc: 'Humanities (History, Political Science, Geography) aligns well with UPSC syllabus.' },
      { step: 3, stage: 'Class 11–12',   title: 'NCERT mastery',              desc: 'Master NCERT books from Class 6–12 across History, Geography, Polity and Economics.' },
      { step: 4, stage: 'Entrance Exam', title: 'Graduation first',           desc: 'Any bachelor\'s degree from a recognised university is mandatory before appearing for UPSC.' },
      { step: 5, stage: 'Degree',        title: 'Any Graduation (3–4 years)', desc: 'Use graduation years to systematically cover the UPSC syllabus. Many start coaching alongside college.' },
      { step: 6, stage: 'First Job',     title: 'UPSC CSE Prelims → Mains → Interview', desc: 'The exam has a less than 0.5% selection rate. Most aspirants attempt 2–3 times. Patience and consistency are key.' },
      { step: 7, stage: 'Growth',        title: 'District Collector → Secretary → Cabinet', desc: 'IAS officers progress from Sub-Divisional Magistrate to District Collector, then to state/central secretariat roles.' },
    ],
    dayInTheLife: 'A District Collector\'s day starts with reviewing official files and attending field inspections of government schemes. Afternoon involves meeting citizens for grievance redressal and chairing inter-departmental meetings. Unexpected crises — floods, election duties, law-and-order — can reshape the entire day.',
    futureOutlook: 'Civil services remain one of India\'s most coveted and stable careers with job security, societal impact and perks. The government is modernising administration through digital India, creating opportunities for tech-savvy officers. UPSC competition intensifies each year with over 500,000 applicants.',
    relatedCareers: ['lawyer', 'defence_officer', 'teacher'],
  },

  {
    id:          'defence_officer',
    title:       'Defence Officer',
    stream:      'Defence & Security',
    icon:        '🎖️',
    description: 'Defence officers serve in the Indian Army, Navy or Air Force as commissioned officers, leading troops, operating advanced systems and safeguarding national security.',
    riasecTypes:       ['R', 'E'],
    requiredAptitudes: ['logical_reasoning', 'spatial_reasoning'],
    skills: ['Leadership', 'Tactical Decision Making', 'Physical Fitness', 'Technical Operations', 'Team Coordination'],
    salary: {
      entry:  { min: 600000,  max: 900000  },
      mid:    { min: 900000,  max: 1500000 },
      senior: { min: 1500000, max: 3000000 },
    },
    entranceExams: [
      { name: 'NDA',    desc: 'National Defence Academy exam for joining after Class 12 (Army, Navy, Air Force)' },
      { name: 'CDS',    desc: 'Combined Defence Services exam for graduates to join IMA, OTA, INA or AFA' },
      { name: 'AFCAT',  desc: 'Air Force Common Admission Test for Flying, Technical and Ground Duty branches' },
      { name: 'SSB',    desc: 'Services Selection Board interview — a 5-day psychological and physical assessment mandatory for all entries' },
    ],
    topColleges: ['NDA Khadakwasla', 'IMA Dehradun', 'Indian Naval Academy Ezhimala', 'Air Force Academy Dundigal', 'OTA Chennai'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Physical & academic fitness', desc: 'Build physical endurance through sport. Maintain good academic scores, especially in Maths and Science.' },
      { step: 2, stage: 'Stream',        title: 'Science (PCM) for technical', desc: 'PCM is required for technical branches. Any stream works for administrative and logistics roles.' },
      { step: 3, stage: 'Class 11–12',   title: 'NDA preparation',             desc: 'Begin NDA coaching. The exam tests Maths, English and General Ability. Crack SSB requires personality development.' },
      { step: 4, stage: 'Entrance Exam', title: 'NDA / CDS / AFCAT + SSB',    desc: 'Clear the written exam and pass the 5-day SSB assessment testing intelligence, teamwork and leadership.' },
      { step: 5, stage: 'Degree',        title: 'Training at NDA / IMA / AFA', desc: '3-year NDA training includes BSc + military training. IMA graduation earns a BA/BSc and commission.' },
      { step: 6, stage: 'First Job',     title: 'Lieutenant / Flying Officer / Sub-Lieutenant', desc: 'Join your regiment or squadron. Lead a small team, manage equipment and handle field operations.' },
      { step: 7, stage: 'Growth',        title: 'Colonel / Group Captain / Commodore', desc: 'Promotion through merit and years of service. Senior officers command large units and shape military strategy.' },
    ],
    dayInTheLife: 'An Army officer\'s day begins before dawn with physical training and inspection. Operational duties — training exercises, equipment checks, administrative tasks — fill the morning. Afternoons may involve strategy sessions, welfare activities for troops or technical coursework.',
    futureOutlook: 'The Indian Armed Forces are modernising rapidly with drone warfare, cyber capabilities and advanced weapons systems. Officer vacancies remain steady, with Agniveer and regular commission routes available. Lateral entry into corporate security and defence manufacturing is a growing exit option.',
    relatedCareers: ['civil_services_ias', 'commercial_pilot', 'electrician_iti'],
  },

  // ── Design & Architecture ────────────────────────────────────────────────────

  {
    id:          'architect',
    title:       'Architect',
    stream:      'Design & Architecture',
    icon:        '🏗️',
    description: 'Architects design buildings and spaces that are functional, safe and beautiful. They work from initial concept sketches through to construction supervision and project completion.',
    riasecTypes:       ['A', 'R'],
    requiredAptitudes: ['spatial_reasoning', 'logical_reasoning'],
    skills: ['Architectural Drawing', 'CAD / BIM Software', 'Structural Knowledge', 'Creative Design', 'Project Management'],
    salary: {
      entry:  { min: 300000,  max: 600000  },
      mid:    { min: 800000,  max: 1800000 },
      senior: { min: 2000000, max: 5000000 },
    },
    entranceExams: [
      { name: 'NATA',          desc: 'National Aptitude Test in Architecture — mandatory for B.Arch admissions' },
      { name: 'JEE Paper 2',   desc: 'B.Arch admission to IITs and NITs via JEE Paper 2 (Maths + Drawing + Aptitude)' },
      { name: 'CUET (B.Arch)', desc: 'Central Universities Common Entrance Test for Architecture programmes' },
    ],
    topColleges: ['IIT Kharagpur (Arch)', 'SPA Delhi', 'CEPT Ahmedabad', 'SPA Bhopal', 'RV College of Architecture Bangalore'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Maths, drawing & observation', desc: 'Practice sketching buildings and spaces. Maths is critical — focus on geometry and measurement.' },
      { step: 2, stage: 'Stream',        title: 'Science with Maths (PCM)',    desc: 'Physics, Chemistry and Maths are required for architecture programmes.' },
      { step: 3, stage: 'Class 11–12',   title: 'NATA / JEE Paper 2 prep',    desc: 'Practice architectural drawing intensively. NATA tests three-dimensional understanding and aesthetic sensitivity.' },
      { step: 4, stage: 'Entrance Exam', title: 'NATA / JEE Paper 2',         desc: 'Score well in both drawing and aptitude components. SPA and IIT B.Arch are extremely competitive.' },
      { step: 5, stage: 'Degree',        title: 'B.Arch (5 years)',           desc: 'Studio-based learning with design projects, structural studies and materials science. Internship is mandatory.' },
      { step: 6, stage: 'First Job',     title: 'Junior Architect',           desc: 'Work at an architectural firm or construction company. Assist in design development and site supervision.' },
      { step: 7, stage: 'Growth',        title: 'Principal Architect / Own Studio', desc: 'Start your own practice or become principal at a large firm. Sustainable design and smart cities are lucrative niches.' },
    ],
    dayInTheLife: 'An architect\'s morning is often spent at a drafting station, working in AutoCAD or Revit to develop design plans. Site visits fill the afternoon — reviewing construction quality, coordinating with contractors and resolving on-ground issues. Client presentations and design reviews are weekly fixtures.',
    futureOutlook: 'India\'s urbanisation is driving massive construction demand — smart cities, affordable housing and infrastructure upgrades. Green architecture and BIM (Building Information Modelling) expertise command premium salaries. The profession is becoming more technology-driven.',
    relatedCareers: ['graphic_designer', 'fashion_designer', 'entrepreneur'],
  },

  {
    id:          'graphic_designer',
    title:       'Graphic Designer',
    stream:      'Design & Architecture',
    icon:        '🎨',
    description: 'Graphic designers create visual communication — logos, advertising, packaging, digital interfaces and publications — that inform and inspire audiences.',
    riasecTypes:       ['A', 'I'],
    requiredAptitudes: ['spatial_reasoning', 'verbal_ability'],
    skills: ['Adobe Photoshop / Illustrator', 'Typography', 'Visual Storytelling', 'UI/UX Basics', 'Colour Theory'],
    salary: {
      entry:  { min: 200000, max: 500000  },
      mid:    { min: 600000, max: 1500000 },
      senior: { min: 1500000, max: 3500000 },
    },
    entranceExams: [
      { name: 'UCEED',    desc: 'Undergraduate Common Entrance Exam for Design — IIT Design courses' },
      { name: 'NID DAT',  desc: 'National Institute of Design Design Aptitude Test for all NID campuses' },
      { name: 'NIFT Entrance', desc: 'National Institute of Fashion Technology entrance for design programmes' },
      { name: 'MIT-ID',   desc: 'MIT Institute of Design entrance for B.Des admission' },
    ],
    topColleges: ['NID Ahmedabad', 'IDC IIT Bombay', 'NIFT Delhi', 'Srishti Manipal Bangalore', 'MIT Institute of Design Pune'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Sketch, observe and create', desc: 'Draw every day. Study logos, posters and packaging with a designer\'s eye. Photography is a bonus skill.' },
      { step: 2, stage: 'Stream',        title: 'Any stream — portfolio matters most', desc: 'Stream choice is flexible. Build a strong design portfolio with original work throughout school.' },
      { step: 3, stage: 'Class 11–12',   title: 'Build the design portfolio',  desc: 'Create a diverse portfolio — logos, posters, illustrations, web mockups. Enter design competitions.' },
      { step: 4, stage: 'Entrance Exam', title: 'UCEED / NID DAT / NIFT',    desc: 'These exams test observation, creativity and aesthetic sense — not rote learning. Practice sketching under timed conditions.' },
      { step: 5, stage: 'Degree',        title: 'B.Des / BFA (4 years)',      desc: 'Deep dive into typography, branding, motion graphics and interaction design. Internships at agencies are valuable.' },
      { step: 6, stage: 'First Job',     title: 'Junior Designer / Visualiser', desc: 'Join an ad agency, digital studio or in-house brand team. Build a diverse professional portfolio.' },
      { step: 7, stage: 'Growth',        title: 'Creative Director / Design Studio', desc: 'Senior designers and CDs command excellent packages. Many start boutique studios or become freelancers earning globally.' },
    ],
    dayInTheLife: 'A graphic designer starts with client briefs and mood-boarding, then moves to creating visual concepts in Adobe tools. Feedback sessions mid-day lead to revisions. Afternoons often involve typography work, preparing final print/digital assets and project handoffs.',
    futureOutlook: 'Digital transformation has exploded demand for graphic designers across e-commerce, media and startups. UI/UX design now commands higher salaries than print design. Motion graphics and brand identity specialists are in short supply, keeping rates high.',
    relatedCareers: ['game_developer', 'fashion_designer', 'architect'],
  },

  {
    id:          'fashion_designer',
    title:       'Fashion Designer',
    stream:      'Design & Architecture',
    icon:        '👗',
    description: 'Fashion designers create clothing, accessories and footwear — translating cultural trends, artistic vision and functional requirements into wearable products.',
    riasecTypes:       ['A', 'R'],
    requiredAptitudes: ['spatial_reasoning', 'verbal_ability'],
    skills: ['Illustration & Sketching', 'Textiles & Materials', 'Pattern Making', 'Trend Analysis', 'Adobe Illustrator'],
    salary: {
      entry:  { min: 200000, max: 400000  },
      mid:    { min: 600000, max: 1500000 },
      senior: { min: 1500000, max: 4000000 },
    },
    entranceExams: [
      { name: 'NIFT Entrance', desc: 'National Institute of Fashion Technology — the most prestigious fashion college entrance in India' },
      { name: 'NID DAT',  desc: 'National Institute of Design aptitude test for fashion/textile design' },
      { name: 'IIAD Entrance', desc: 'Indian Institute of Art and Design entrance exam' },
      { name: 'Pearl Academy', desc: 'Pearl Academy Design entrance for fashion and accessory design' },
    ],
    topColleges: ['NIFT Delhi', 'NID Ahmedabad', 'Pearl Academy Mumbai', 'Symbiosis Institute of Design', 'JD School of Design Bangalore'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Draw, stitch and explore',   desc: 'Develop illustration skills and learn basic stitching. Visit fabric markets and observe clothing construction.' },
      { step: 2, stage: 'Stream',        title: 'Any stream — portfolio is key', desc: 'All streams are eligible. Building a fashion illustration portfolio matters more than subject choice.' },
      { step: 3, stage: 'Class 11–12',   title: 'Portfolio & NIFT prep',       desc: 'Create a diverse portfolio of fashion sketches and design concepts. Practice situational tests.' },
      { step: 4, stage: 'Entrance Exam', title: 'NIFT Entrance / NID DAT',    desc: 'NIFT tests CAT (Creative Ability Test) with drawing + situational ability and GAT (General Ability Test).' },
      { step: 5, stage: 'Degree',        title: 'B.Des Fashion Design (4 years)', desc: 'Study textiles, garment construction, collection development and fashion communication. Internships are mandatory.' },
      { step: 6, stage: 'First Job',     title: 'Design Assistant / Buyer',   desc: 'Join a retail brand, export house or boutique label. The garment export industry employs many fresh graduates.' },
      { step: 7, stage: 'Growth',        title: 'Head Designer / Own Label',  desc: 'Senior designers lead seasonal collections. Many launch their own labels via Myntra, Instagram and fashion weeks.' },
    ],
    dayInTheLife: 'A fashion designer\'s day begins with sketching new season concepts and reviewing fabric swatches. Mid-morning involves fitting sessions with tailors, adjusting drape and construction. Afternoons are for mood-board creation, production follow-up and trend research.',
    futureOutlook: 'India is the world\'s second-largest textile exporter and a growing fashion market. Sustainable fashion, ethnic wear fusion and direct-to-consumer brands are creating exciting opportunities. Social media has enabled independent designers to build global audiences without gatekeepers.',
    relatedCareers: ['graphic_designer', 'entrepreneur', 'architect'],
  },

  // ── Education ────────────────────────────────────────────────────────────────

  {
    id:          'teacher',
    title:       'Teacher',
    stream:      'Education',
    icon:        '📚',
    description: 'Teachers educate and inspire the next generation — from primary school to university. It is one of the most impactful careers, with school teachers, college lecturers and corporate trainers all in demand.',
    riasecTypes:       ['S', 'A'],
    requiredAptitudes: ['verbal_ability', 'logical_reasoning'],
    skills: ['Subject Expertise', 'Communication', 'Classroom Management', 'Curriculum Design', 'Patience'],
    salary: {
      entry:  { min: 250000, max: 500000  },
      mid:    { min: 500000, max: 1000000 },
      senior: { min: 1000000, max: 2000000 },
    },
    entranceExams: [
      { name: 'CTET',      desc: 'Central Teacher Eligibility Test — mandatory for central government school teaching' },
      { name: 'State TET', desc: 'State Teacher Eligibility Tests (UPTET, REET, MAHA-TET, etc.)' },
      { name: 'UGC-NET',   desc: 'National Eligibility Test for college/university lectureship and JRF' },
      { name: 'CUET',      desc: 'For BA/BSc/BCom to build subject expertise before BEd' },
    ],
    topColleges: ['Delhi University (BEd)', 'BHU Varanasi', 'RIE NCERT (Regional Institutes of Education)', 'Jamia Millia Islamia', 'Amity University'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Communication skills',       desc: 'Develop clarity in speaking and writing. Tutoring younger siblings or friends builds early teaching instincts.' },
      { step: 2, stage: 'Stream',        title: 'Any stream matching subject interest', desc: 'Choose the stream that aligns with what you want to teach — Science, Humanities or Commerce.' },
      { step: 3, stage: 'Class 11–12',   title: 'Deepen subject knowledge',   desc: 'Become an expert in your chosen subject. Reading beyond the syllabus sets great teachers apart.' },
      { step: 4, stage: 'Entrance Exam', title: 'CUET / university entrance',  desc: 'Enter a 3-year degree programme in your subject of specialisation.' },
      { step: 5, stage: 'Degree',        title: 'BA/BSc/BCom + BEd (3+2 years)', desc: 'Complete a Bachelor\'s degree followed by BEd (or integrated 4-year BEd). Clear CTET for central schools.' },
      { step: 6, stage: 'First Job',     title: 'School or College Teacher',  desc: 'Join a government school via state recruitment, or a private school directly. College positions need NET/JRF.' },
      { step: 7, stage: 'Growth',        title: 'Head of Department / Principal', desc: 'Progress to HOD, Vice Principal or Principal. EdTech roles and curriculum development offer well-paid alternatives.' },
    ],
    dayInTheLife: 'A school teacher\'s day starts with lesson plan review before classes begin. Teaching periods are interspersed with free periods used for assessment and preparation. After school hours involve parent meetings, co-curricular activities and administrative tasks.',
    futureOutlook: 'India is the world\'s largest education market, with NEP 2020 driving significant teacher recruitment. Quality teachers are in short supply in Tier 2 and 3 cities. EdTech platforms like BYJU\'S, Unacademy and Vedantu have created well-paid digital teaching careers.',
    relatedCareers: ['psychologist', 'journalist', 'civil_services_ias'],
  },

  // ── Media & Communication ────────────────────────────────────────────────────

  {
    id:          'journalist',
    title:       'Journalist',
    stream:      'Media & Communication',
    icon:        '📰',
    description: 'Journalists research, investigate and report on events, issues and ideas for newspapers, television, digital platforms and podcasts, keeping citizens informed and holding power to account.',
    riasecTypes:       ['A', 'E'],
    requiredAptitudes: ['verbal_ability', 'logical_reasoning'],
    skills: ['Writing & Editing', 'Research', 'Interviewing', 'Storytelling', 'Digital Media Tools'],
    salary: {
      entry:  { min: 200000, max: 400000  },
      mid:    { min: 500000, max: 1200000 },
      senior: { min: 1200000, max: 3000000 },
    },
    entranceExams: [
      { name: 'CUET',               desc: 'For BA Journalism / Mass Communication at central universities' },
      { name: 'IPU CET',            desc: 'Indraprastha University entrance for BJMC' },
      { name: 'IIMC Entrance',      desc: 'Indian Institute of Mass Communication PG diploma entrance' },
      { name: 'Symbiosis SET',      desc: 'Symbiosis Entrance Test for BJMC and other media programmes' },
    ],
    topColleges: ['IIMC New Delhi', 'AJK MCRC Jamia Millia', 'SIMC Pune', 'Manipal Institute of Communication', 'Asian College of Journalism Chennai'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Read and write voraciously', desc: 'Read multiple newspapers daily. Keep a journal. Participate in school magazine and debate.' },
      { step: 2, stage: 'Stream',        title: 'Humanities preferred',       desc: 'History, Political Science and English in Humanities align well with journalism careers.' },
      { step: 3, stage: 'Class 11–12',   title: 'Build a writing portfolio',  desc: 'Write for school publications, local blogs or youth journalism platforms. Social media presence helps.' },
      { step: 4, stage: 'Entrance Exam', title: 'CUET / IPU CET / IIMC',    desc: 'Enter a 3-year BJMC programme or directly apply for PG at IIMC after any graduation.' },
      { step: 5, stage: 'Degree',        title: 'BJMC / BA Journalism (3 years)', desc: 'Intern at news organisations every semester. Build a portfolio of published work.' },
      { step: 6, stage: 'First Job',     title: 'Reporter / Content Writer',  desc: 'Start as a beat reporter at a news outlet, or as a content writer at a digital media company.' },
      { step: 7, stage: 'Growth',        title: 'Editor / Bureau Chief / Anchor', desc: 'Senior journalists become editors, anchors or launch their own newsletters and podcasts. Investigative reporters gain national recognition.' },
    ],
    dayInTheLife: 'A journalist\'s day is unpredictable — it might start with a press briefing, shift to a protest on the street and end with writing a 1,000-word piece by midnight. Research, source-building and fact-checking fill the quieter hours. Deadlines are non-negotiable.',
    futureOutlook: 'Digital media has disrupted traditional journalism but created many new formats — newsletters, podcasts, video journalism and data journalism. Skilled reporters are in demand at digital-first newsrooms. Data journalism and investigative reporting command the best salaries.',
    relatedCareers: ['lawyer', 'teacher', 'entrepreneur'],
  },

  // ── Aviation ─────────────────────────────────────────────────────────────────

  {
    id:          'commercial_pilot',
    title:       'Commercial Pilot',
    stream:      'Aviation',
    icon:        '✈️',
    description: 'Commercial pilots operate passenger and cargo aircraft, ensuring the safe and efficient transport of people and goods across domestic and international routes.',
    riasecTypes:       ['R', 'I'],
    requiredAptitudes: ['spatial_reasoning', 'numerical_ability'],
    skills: ['Aircraft Systems', 'Navigation', 'Crew Resource Management', 'Decision Making Under Pressure', 'Communication'],
    salary: {
      entry:  { min: 1500000, max: 2500000 },
      mid:    { min: 3000000, max: 5000000 },
      senior: { min: 5000000, max: 8000000 },
    },
    entranceExams: [
      { name: 'Class 12 PCM + English', desc: 'Minimum academic qualification — 50% in Physics, Maths and English' },
      { name: 'DGCA Class 2 Medical',   desc: 'Medical fitness certificate from a DGCA-approved examiner — mandatory first step' },
      { name: 'Pilot Aptitude Test',    desc: 'Psychomotor and aptitude tests at flying schools and airlines\' cadet programmes' },
      { name: 'DGCA CPL / ATPL Exams', desc: 'Directorate General of Civil Aviation licence exams — Meteorology, Air Navigation, Regulations, etc.' },
    ],
    topColleges: ['Indira Gandhi Rashtriya Uran Akademi (IGRUA)', 'National Flying Training Institute Gondia', 'CAE Oxford Aviation Academy (India)', 'Chimes Aviation Academy', 'Government Aviation Training Institute Bhopal'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Maths and Physics focus',    desc: 'Score well in Maths and Science. Spatial awareness activities like model planes and flight simulators help.' },
      { step: 2, stage: 'Stream',        title: 'Science (PCM) mandatory',    desc: 'Physics and Maths are essential. English proficiency is equally important for cockpit communication.' },
      { step: 3, stage: 'Class 11–12',   title: 'DGCA medical + aptitude prep', desc: 'Get a DGCA Class 2 medical done. Research cadet programmes at IndiGo, Air India and flying schools.' },
      { step: 4, stage: 'Entrance Exam', title: 'Flying school entrance + DGCA medical', desc: 'Pass the aptitude and psychomotor tests. Get your Class 2 Medical Certificate from a DGCA examiner.' },
      { step: 5, stage: 'Degree',        title: 'CPL training (18–24 months)', desc: 'Train at a DGCA-approved flying school to earn your Commercial Pilot Licence. Total cost: ₹35–80 lakh.' },
      { step: 6, stage: 'First Job',     title: 'First Officer (Co-Pilot)',   desc: 'Join an airline as First Officer on narrow-body aircraft like A320 or B737. Accumulate flying hours.' },
      { step: 7, stage: 'Growth',        title: 'Captain on wide-body aircraft', desc: 'Progress to Captain after 2,500+ hours. Senior captains on wide-body international routes earn ₹50–80 lakh annually.' },
    ],
    dayInTheLife: 'A pilot\'s day starts with pre-flight planning — reviewing weather, NOTAMs and fuel calculations. The flight itself involves close coordination with the co-pilot and ATC. After landing, post-flight debriefs and rest requirements in accordance with DGCA duty-time regulations follow.',
    futureOutlook: 'India will need 10,000+ new pilots by 2030 due to rapid aviation growth. IndiGo, Air India and new entrants are expanding fleets aggressively. The career is expensive to enter but offers excellent long-term salary and lifestyle benefits.',
    relatedCareers: ['defence_officer', 'software_engineer', 'agricultural_scientist'],
  },

  // ── Hospitality & Tourism ────────────────────────────────────────────────────

  {
    id:          'hotel_management',
    title:       'Hotel Management',
    stream:      'Hospitality & Tourism',
    icon:        '🏨',
    description: 'Hotel management professionals run operations, food services, events and guest experiences at hotels, resorts and hospitality businesses. It blends business acumen with people skills.',
    riasecTypes:       ['S', 'E'],
    requiredAptitudes: ['verbal_ability', 'logical_reasoning'],
    skills: ['Guest Relations', 'Food & Beverage Management', 'Housekeeping Operations', 'Revenue Management', 'Event Planning'],
    salary: {
      entry:  { min: 200000, max: 400000  },
      mid:    { min: 500000, max: 1200000 },
      senior: { min: 1200000, max: 3000000 },
    },
    entranceExams: [
      { name: 'NCHM JEE', desc: 'National Council for Hotel Management Joint Entrance Exam for central IHMs' },
      { name: 'IIHM eCHAT', desc: 'International Institute of Hotel Management entrance test' },
      { name: 'CUET',       desc: 'Some central universities use CUET for hospitality management programmes' },
      { name: 'State HM Entrance', desc: 'State-level hotel management entrance exams for state IHMs' },
    ],
    topColleges: ['IHM Mumbai', 'IHM Delhi', 'IHM Chennai', 'Oberoi Centre of Learning & Development', 'Welcomgroup Graduate School of Hotel Administration'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Communication & service mindset', desc: 'Develop English communication skills. Participate in school events and develop hospitality thinking.' },
      { step: 2, stage: 'Stream',        title: 'Any stream — 10+2 required',  desc: 'All streams are eligible. Good English and Maths scores help with NCHM JEE.' },
      { step: 3, stage: 'Class 11–12',   title: 'NCHM JEE preparation',        desc: 'Prepare for NCHM JEE — covers Numerical Ability, English, Reasoning, GK and Service Aptitude.' },
      { step: 4, stage: 'Entrance Exam', title: 'NCHM JEE / State HM Entrance', desc: 'Secure a seat at a central IHM or state hotel management college.' },
      { step: 5, stage: 'Degree',        title: 'B.Sc Hotel Management (3 years)', desc: 'Practical-heavy curriculum — kitchen, housekeeping and front-office rotations with industry internships.' },
      { step: 6, stage: 'First Job',     title: 'Management Trainee',          desc: 'Join a hotel chain as a management trainee. Rotate through departments and earn your first department head role.' },
      { step: 7, stage: 'Growth',        title: 'General Manager / F&B Director', desc: 'Senior positions at luxury hotels and international chains come with excellent pay and global posting opportunities.' },
    ],
    dayInTheLife: 'A front office manager\'s day starts with the morning briefing covering occupancy, expected arrivals and VIP guests. Hours are spent on the floor ensuring guest satisfaction and managing check-ins and check-outs. Evening involves reviewing revenue reports and resolving any escalations.',
    futureOutlook: 'India\'s hospitality sector is growing at 7–8% annually, driven by domestic tourism, business travel and luxury hotel expansion. Post-COVID recovery has accelerated demand for trained professionals. Food tech, sustainable hospitality and event management are emerging niches.',
    relatedCareers: ['entrepreneur', 'teacher', 'journalist'],
  },

  // ── Agriculture & Environment ────────────────────────────────────────────────

  {
    id:          'agricultural_scientist',
    title:       'Agricultural Scientist',
    stream:      'Agriculture & Environment',
    icon:        '🌾',
    description: 'Agricultural scientists research and develop new crop varieties, farming techniques and food production methods to improve yields, sustainability and food security.',
    riasecTypes:       ['I', 'R'],
    requiredAptitudes: ['logical_reasoning', 'numerical_ability'],
    skills: ['Crop Science', 'Research Methodology', 'Soil Science', 'Data Analysis', 'Field Experimentation'],
    salary: {
      entry:  { min: 300000, max: 500000  },
      mid:    { min: 600000, max: 1200000 },
      senior: { min: 1200000, max: 2500000 },
    },
    entranceExams: [
      { name: 'ICAR AIEEA',  desc: 'Indian Council of Agricultural Research All India Entrance Exam for BSc Ag / BVSc' },
      { name: 'State Agriculture Entrance', desc: 'State-level agriculture university entrances (e.g., Rajmata Krishnakumari, PAU Ludhiana)' },
      { name: 'CUET',        desc: 'Some universities accept CUET scores for agriculture programmes' },
      { name: 'ICAR JRF',    desc: 'ICAR Junior Research Fellowship for postgraduate research fellowships' },
    ],
    topColleges: ['IARI New Delhi', 'BHU Varanasi (Faculty of Agri)', 'GBPUAT Pantnagar', 'PAU Ludhiana', 'TNAU Coimbatore'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Science and curiosity about nature', desc: 'Develop interest in Biology and Chemistry. Visiting a farm or plant nursery builds early intuition.' },
      { step: 2, stage: 'Stream',        title: 'Science (PCB or PCM)',         desc: 'Physics, Chemistry and Biology (PCB) is the standard path. Agriculture as an elective is a bonus.' },
      { step: 3, stage: 'Class 11–12',   title: 'ICAR AIEEA preparation',      desc: 'Prepare for ICAR AIEEA — covers Physics, Chemistry, Mathematics / Biology based on your stream.' },
      { step: 4, stage: 'Entrance Exam', title: 'ICAR AIEEA / State Agriculture', desc: 'Qualify the entrance to join a 4-year BSc (Hons) Agriculture at a state agricultural university.' },
      { step: 5, stage: 'Degree',        title: 'BSc Agriculture (4 years)',   desc: 'Field-based programme with crop science, soil science, agronomy and economics components.' },
      { step: 6, stage: 'First Job',     title: 'Research Associate / Agriculture Officer', desc: 'Join ICAR, state agriculture departments, agritech startups or input companies (seed/fertiliser firms).' },
      { step: 7, stage: 'Growth',        title: 'Principal Scientist / Agritech Founder', desc: 'Senior ICAR scientists influence national policy. Agritech startups are creating high-paid roles in precision farming and biotech.' },
    ],
    dayInTheLife: 'An agricultural scientist splits time between field trials and the laboratory. Morning involves monitoring experimental crop plots, measuring growth and noting observations. Afternoons are for lab analysis, data processing and writing research papers or government reports.',
    futureOutlook: 'Climate change, food security and India\'s goal of doubling farmer income are making agricultural science critical. Precision agriculture, drones, soil sensors and biotechnology are transforming the field. Agritech startups are offering competitive private sector salaries.',
    relatedCareers: ['data_scientist', 'doctor', 'electrician_iti'],
  },

  // ── Skilled Trades ───────────────────────────────────────────────────────────

  {
    id:          'electrician_iti',
    title:       'Electrician (ITI)',
    stream:      'Skilled Trades',
    icon:        '⚡',
    description: 'ITI-trained electricians install, maintain and repair electrical systems in homes, factories and infrastructure projects. It is a highly practical career with strong job security and self-employment potential.',
    riasecTypes:       ['R', 'C'],
    requiredAptitudes: ['logical_reasoning', 'numerical_ability'],
    skills: ['Electrical Wiring', 'Circuit Diagnosis', 'Safety Protocols', 'Technical Drawing', 'Problem Solving'],
    salary: {
      entry:  { min: 150000, max: 300000  },
      mid:    { min: 400000, max: 800000  },
      senior: { min: 800000, max: 1500000 },
    },
    entranceExams: [
      { name: 'State ITI Admission',  desc: 'Class 10-based merit / entrance for admission to 2-year ITI Electrician trade' },
      { name: 'NCVT MIS',            desc: 'NCVT (National Council for Vocational Training) certification exams after the trade course' },
      { name: 'Apprenticeship Portal', desc: 'National Apprenticeship Portal for practical training under registered employers' },
    ],
    topColleges: ['Govt ITI Mumbai', 'Govt ITI Delhi', 'Govt ITI Chennai', 'Govt ITI Faridabad', 'Private ITIs under NCVT affiliation (all states)'],
    roadmap: [
      { step: 1, stage: 'Class 10',      title: 'Maths and Science basics',   desc: 'Score well in Class 10. Basic Maths (algebra, ratios) and Physics (circuits, electricity) are directly used.' },
      { step: 2, stage: 'ITI Admission', title: 'ITI Electrician trade',       desc: 'Apply for a 2-year ITI Electrician trade at a government or NCVT-affiliated private ITI.' },
      { step: 3, stage: 'ITI Training',  title: 'Practical hands-on training', desc: 'Learn wiring, panel work, motor controls and safety standards in workshops. Theory covers NEC and IS standards.' },
      { step: 4, stage: 'Certification', title: 'NCVT Certificate + Apprenticeship', desc: 'Complete the NCVT exam and apply for a 1-year apprenticeship with a company for real-world experience.' },
      { step: 5, stage: 'Degree',        title: 'Optional: Diploma / BEng Electrical', desc: 'Lateral entry into diploma programmes after ITI is possible, upgrading qualifications for supervisory roles.' },
      { step: 6, stage: 'First Job',     title: 'Trainee Electrician',        desc: 'Work with a contractor, industrial plant, construction company or government department.' },
      { step: 7, stage: 'Growth',        title: 'Master Electrician / Own Business', desc: 'Obtain electrical contractor licence and start your own contracting business. Senior electricians at power plants earn ₹8–15 lakh.' },
    ],
    dayInTheLife: 'An electrician\'s day varies between job sites — installing wiring in a new building in the morning, then diagnosing a fault at a factory in the afternoon. Each job requires careful safety checks, reading electrical drawings and verifying compliance with standards.',
    futureOutlook: 'India\'s infrastructure boom, solar energy expansion and smart home installations are creating massive demand for skilled electricians. Solar panel installation and EV charging infrastructure are fast-growing specialisations. Skilled tradespeople with NCVT certification earn well and face very low unemployment.',
    relatedCareers: ['agricultural_scientist', 'defence_officer', 'entrepreneur'],
  },
]

export default CAREERS

/*
  CAREER_STREAMS — unique stream names for filter chips on the careers page.
  Derived from the data so it stays in sync automatically.
*/
export const CAREER_STREAMS = [...new Set(CAREERS.map(c => c.stream))]
