import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

function generateIntelligentFallback(message, user, latestResult, topCareers) {
  const q = message.toLowerCase();
  const userName = user?.fullName?.split(' ')[0] || 'there';

  // Greeting
  if (q.includes('hello') || q.includes('hi') || q === 'hey') {
    if (latestResult && topCareers.length > 0) {
      const topNames = topCareers.map(c => `${c.title} (${c.matchPct}% match)`).join(', ');
      return `Hello ${userName}! Great to chat with you. I see you've completed your aptitude test with a top score of ${latestResult.overallScore}%. Your profile strongly aligns with ${topNames}. What career path or subject would you like to explore today?`;
    }
    return `Hello ${userName}! I'm your PathFinder AI Career Counsellor. You can ask me about subject streams (PCM, PCB, Commerce, Arts), entrance exams like JEE, NEET, CUET, CLAT, or specific careers. How can I help you today?`;
  }

  // Question about results or recommendations
  if (q.includes('result') || q.includes('score') || q.includes('career') || q.includes('match') || q.includes('option') || q.includes('recommend')) {
    if (latestResult && topCareers.length > 0) {
      const careerDetails = topCareers.map((c, i) => `${i + 1}. **${c.title}** (${c.matchPct}% match)`).join('\n');
      return `Based on your completed assessment:\n\n- **Overall Aptitude Score**: ${latestResult.overallScore}/100\n- **Key Strengths**: ${latestResult.strengths?.join(', ')?.replace(/_/g, ' ') || 'Analytical thinking'}\n\n**Your Top Career Recommendations**:\n${careerDetails}\n\nYou can click on any of these careers in the Career Explorer to view their detailed roadmaps, entrance exams, and required college degrees. Would you like advice on preparing for one of these?`;
    }
    return `You haven't completed the full aptitude assessment yet! Once you complete the 36-question test from the "Aptitude Test" tab, I can calculate your exact match percentages for over 20+ careers. In the meantime, tell me what subjects you enjoy most!`;
  }

  // Science / Engineering
  if (q.includes('engineer') || q.includes('pcm') || q.includes('tech') || q.includes('software') || q.includes('computer') || q.includes('ai')) {
    return `Engineering & Tech is a high-growth domain in India:\n\n- **Stream Required**: Science with PCM (Physics, Chemistry, Maths)\n- **Key Entrance Exams**: JEE Main & JEE Advanced (for IITs/NITs), BITSAT (BITS Pilani), state CETs, and VITEEE\n- **Top Fields**: AI & Machine Learning, Computer Science, Data Engineering, and Robotics\n\nFocus on building solid concepts in Class 11-12 Calculus and Mechanics, and start practicing coding logic early!`;
  }

  // Medicine / Biology
  if (q.includes('doctor') || q.includes('pcb') || q.includes('medical') || q.includes('neet') || q.includes('biology')) {
    return `Pursuing a medical or healthcare career in India:\n\n- **Stream Required**: Science with PCB (Physics, Chemistry, Biology)\n- **Primary Entrance Exam**: NEET-UG (mandatory for MBBS, BDS, BAMS, BHMS)\n- **Alternative High-Demand Paths**: Biotechnology, Biomedical Engineering, Clinical Psychology, and Physiotherapy\n\nNCERT mastery in Biology and Organic Chemistry is the cornerstone for high NEET percentiles.`;
  }

  // Commerce / Finance / CA
  if (q.includes('commerce') || q.includes('ca') || q.includes('finance') || q.includes('business') || q.includes('account')) {
    return `Commerce and Business careers offer incredible diversity:\n\n- **Chartered Accountancy (CA)**: Administered by ICAI. You can register for CA Foundation right after Class 12.\n- **Investment Banking & Finance**: Pursue B.Com (Hons), BMS, or BBA from top colleges like SRCC, Shaheed Sukhdev (DU), followed by an MBA or CFA.\n- **CUET**: The entrance exam to target for top central university commerce seats.`;
  }

  // Pilot / Aviation
  if (q.includes('pilot') || q.includes('aviation') || q.includes('flight')) {
    return `Becoming a Commercial Pilot in India:\n\n1. **Eligibility**: Minimum 50% in Class 12 with Physics and Maths (PCM).\n2. **Medical**: Clear DGCA Class 2 medical exam, followed by Class 1.\n3. **Training**: Join a DGCA-approved flying school (like IGRUA, CAE Gondia) or an airline cadet pilot programme to earn your CPL (Commercial Pilot Licence).\n4. **Outlook**: High airline demand with major fleet expansions in India.`;
  }

  // General career advice fallback
  if (latestResult && topCareers.length > 0) {
    const top = topCareers[0];
    return `That's a thoughtful question, ${userName}. Considering your high assessment score (${latestResult.overallScore}%) and strong affinity for **${top.title}**, I recommend focusing on building practical projects, understanding entrance exam patterns (like CUET, JEE, or state exams), and talking to mentors in that field. What specific aspect of your career planning would you like to drill down into next?`;
  }

  return `That's an important topic for your career planning, ${userName}. Career decisions in classes 10-12 hinge on balancing your natural aptitude, genuine interest, and long-term career viability. I recommend taking our 15-minute Aptitude Test to see your personalized match scores, or ask me about specific streams (Science, Commerce, Arts) and entrance exams!`;
}

router.post('/', asyncHandler(async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) throw httpError(422, 'message is required');
  if (message.length > 4000) throw httpError(422, 'message must be 4000 characters or fewer');

  const apiKey = process.env.GEMINI_API_KEY;

  const [latestResult, careers] = await Promise.all([
    prisma.testResult.findFirst({
      where: { attempt: { userId: req.user.id } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.career.findMany(),
  ]);

  let topCareers = [];
  if (latestResult) {
    const sectionScores = latestResult.sectionScores || {};
    const riasecScores = latestResult.riasecScores || {};
    topCareers = careers.map((career) => {
      const riasecPoints = (career.riasecTypes || []).reduce(
        (sum, type) => sum + (riasecScores[type] ?? 0),
        0
      );
      const riasecMatch = Math.min(100, Math.round((riasecPoints / 12) * 100));
      const aptitudes = career.requiredAptitudes || [];
      const aptitudeMatch = aptitudes.length
        ? Math.round(
            aptitudes.reduce((sum, s) => sum + (sectionScores[s] ?? 0), 0) / aptitudes.length
          )
        : 50;
      return {
        title: career.title,
        matchPct: Math.round(0.5 * riasecMatch + 0.5 * aptitudeMatch),
      };
    }).sort((a, b) => b.matchPct - a.matchPct).slice(0, 3);
  }

  let reply = '';

  // 1. Try Gemini API if key is configured
  if (apiKey && apiKey.trim().length > 5) {
    const context = latestResult
      ? `Student test score: ${latestResult.overallScore}/100. RIASEC profile: ${JSON.stringify(latestResult.riasecScores)}. Section scores: ${JSON.stringify(latestResult.sectionScores)}. Top career matches: ${topCareers.map((c) => `${c.title} (${c.matchPct}%)`).join(', ')}.`
      : 'The student has not completed the aptitude test yet. Give general career guidance and suggest taking the test for personalised recommendations.';

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const aiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: 'You are PathFinder, a warm, supportive, and knowledgeable AI career counsellor for Indian school students in classes 8–12. Give clear, practical, age-appropriate, balanced guidance about streams, entrance exams, and career paths in India. Use student context to personalize answers.' }],
          },
          contents: [{
            role: 'user',
            parts: [{ text: `${context}\n\nStudent question: ${message}` }],
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
        }),
      });

      if (aiResponse.ok) {
        const payload = await aiResponse.json();
        reply = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('\n')
          .trim();
      }
    } catch (err) {
      console.warn('Gemini request failed, falling back to smart counsellor:', err.message);
    }
  }

  // 2. Fallback to smart context-aware counsellor if Gemini is not configured or failed
  if (!reply) {
    reply = generateIntelligentFallback(message, req.user, latestResult, topCareers);
  }

  // Save chat history
  try {
    await prisma.chatMessage.createMany({
      data: [
        { userId: req.user.id, role: 'student', content: message },
        { userId: req.user.id, role: 'counsellor', content: reply },
      ],
    });
  } catch (dbErr) {
    console.warn('Could not persist chat message to DB:', dbErr.message);
  }

  return success(res, { reply }, 'Reply generated');
}));

export default router;
