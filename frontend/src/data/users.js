/*
  users.js — seed data for the mock user database.
  This file is ONLY imported by api.js. Components must never import it directly.
  Passwords are plain text here because this is a mock — a real backend would
  store bcrypt hashes and never send them to the client.
*/

const MOCK_USERS = [
  {
    id:                'usr_001',
    fullName:          'Demo Student',
    email:             'demo@pathfinder.in',
    password:          'demo123',
    phone:             '9876543210',
    class:             '12',
    board:             'CBSE',
    schoolName:        'Delhi Public School, R.K. Puram',
    state:             'Delhi',
    preferredLanguage: 'English',
    interests:         ['coding', 'maths', 'design'],
    dob:               '2008-03-15',
    subjectMarks: {
      maths:          85,
      science:        78,
      english:        91,
      socialScience:  72,
      secondLanguage: 88,
      computer:       95,
    },
    createdAt:         '2024-08-01T10:30:00Z',
  },
]

export default MOCK_USERS
