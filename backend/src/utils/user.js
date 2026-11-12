export function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    class: user.grade,
    board: user.board,
    schoolName: user.schoolName,
    state: user.state,
    preferredLanguage: user.preferredLanguage,
    interests: user.interests ?? [],
    dob: user.dob ? user.dob.toISOString().slice(0, 10) : null,
    subjectMarks: user.subjectMarks ?? {},
    createdAt: user.createdAt.toISOString(),
  };
}

export function toPublicResult(result) {
  if (!result) return null;
  return {
    overallScore: result.overallScore,
    sectionScores: result.sectionScores,
    riasecScores: result.riasecScores,
    topTypes: result.topTypes,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    completedAt: result.completedAt.toISOString(),
  };
}
