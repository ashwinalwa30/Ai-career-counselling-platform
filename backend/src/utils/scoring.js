const COGNITIVE_SECTIONS = [
  'logical_reasoning',
  'numerical_ability',
  'verbal_ability',
  'spatial_reasoning',
];

const RIASEC_TYPES = ['R', 'I', 'A', 'S', 'E', 'C'];

export function calculateTestResult(answers, questions) {
  const sectionScores = {};

  for (const sectionId of COGNITIVE_SECTIONS) {
    const sectionQuestions = questions.filter((question) => question.sectionId === sectionId);
    const correct = sectionQuestions.filter(
      (question) => answers[question.id] === question.correctAnswer,
    ).length;

    sectionScores[sectionId] = sectionQuestions.length
      ? Math.round((correct / sectionQuestions.length) * 100)
      : 0;
  }

  const overallScore = Math.round(
    Object.values(sectionScores).reduce((sum, score) => sum + score, 0) /
      COGNITIVE_SECTIONS.length,
  );

  const riasecScores = Object.fromEntries(RIASEC_TYPES.map((type) => [type, 0]));
  const interestQuestions = questions.filter(
    (question) => question.sectionId === 'interest_profile',
  );

  for (const question of interestQuestions) {
    const selectedText = answers[question.id];
    if (!selectedText || !Array.isArray(question.options)) continue;

    const selectedOption = question.options.find((option) =>
      typeof option === 'object' && option !== null && option.text === selectedText,
    );

    if (selectedOption?.riasecType && RIASEC_TYPES.includes(selectedOption.riasecType)) {
      riasecScores[selectedOption.riasecType] += 1;
    }
  }

  const topTypes = Object.entries(riasecScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type);

  const rankedSections = Object.entries(sectionScores).sort((a, b) => b[1] - a[1]);

  return {
    overallScore,
    sectionScores,
    riasecScores,
    topTypes,
    strengths: rankedSections.slice(0, 2).map(([section]) => section),
    weaknesses: rankedSections.slice(2).map(([section]) => section),
  };
}
