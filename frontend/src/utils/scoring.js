/*
  scoring.js — pure functions for calculating aptitude test results.
  Used by api.submitTest to generate the results object.
  All functions are pure (no side-effects) so they are easy to understand
  and straightforward to replace when the real backend scoring is ready.
*/

// The four scored sections — interest_profile uses RIASEC tallying instead
const COGNITIVE_SECTIONS = [
  'logical_reasoning',
  'numerical_ability',
  'verbal_ability',
  'spatial_reasoning',
]

/*
  calculateSectionScores — for each cognitive section, counts correct answers
  and returns the score as an integer percentage (0–100).
  Returns an object keyed by section id, e.g. { logical_reasoning: 83, ... }
*/
export function calculateSectionScores(answers, questions) {
  const scores = {}

  COGNITIVE_SECTIONS.forEach(sectionId => {
    const sectionQs = questions.filter(q => q.section === sectionId)

    if (sectionQs.length === 0) {
      scores[sectionId] = 0
      return
    }

    const correct = sectionQs.filter(q => answers[q.id] === q.correctAnswer).length
    scores[sectionId] = Math.round((correct / sectionQs.length) * 100)
  })

  return scores
}

/*
  calculateOverallScore — arithmetic mean of the four section scores.
  Returns a single integer (0–100).
*/
export function calculateOverallScore(sectionScores) {
  const values = Object.values(sectionScores)
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

/*
  calculateRiasecScores — tallies RIASEC personality points from the interest
  profile section.  Each option in that section carries a riasecType; selecting
  it awards 1 point to that type.
  Returns { R: n, I: n, A: n, S: n, E: n, C: n }.
*/
export function calculateRiasecScores(answers, questions) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  questions
    .filter(q => q.section === 'interest_profile')
    .forEach(q => {
      const selectedText = answers[q.id]
      if (!selectedText) return

      // Options in this section are objects: { text, riasecType }
      const opt = q.options.find(o => o.text === selectedText)
      if (opt?.riasecType) scores[opt.riasecType]++
    })

  return scores
}

/*
  getTopRiasecTypes — returns the two RIASEC type codes with the highest
  scores, sorted descending.  Used to build the personality headline and to
  highlight the student's dominant types on the results page.
*/
export function getTopRiasecTypes(riasecScores) {
  return Object.entries(riasecScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type)
}

/*
  getStrengthsAndWeaknesses — ranks all four sections by score and splits
  them into the top two (strengths) and bottom two (weaknesses).
  Returns { strengths: [sectionId, ...], weaknesses: [sectionId, ...] }.
*/
export function getStrengthsAndWeaknesses(sectionScores) {
  const sorted = Object.entries(sectionScores).sort((a, b) => b[1] - a[1])
  return {
    strengths:  sorted.slice(0, 2).map(([id]) => id),
    weaknesses: sorted.slice(2).map(([id]) => id),
  }
}
