import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, httpError, success } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

function formatSalary(sal) {
  if (!sal) return '';
  const entryMin = sal.entry?.min ? `₹${(sal.entry.min / 100000).toFixed(1)}L` : '';
  const entryMax = sal.entry?.max ? `₹${(sal.entry.max / 100000).toFixed(1)}L` : '';
  const midMin = sal.mid?.min ? `₹${(sal.mid.min / 100000).toFixed(1)}L` : '';
  const midMax = sal.mid?.max ? `₹${(sal.mid.max / 100000).toFixed(1)}L` : '';
  const seniorMin = sal.senior?.min ? `₹${(sal.senior.min / 100000).toFixed(1)}L` : '';
  const seniorMax = sal.senior?.max ? `₹${(sal.senior.max / 100000).toFixed(1)}L` : '';

  let out = '';
  if (entryMin && entryMax) out += `• **Entry-level**: ${entryMin} – ${entryMax}/year\n`;
  if (midMin && midMax) out += `• **Mid-level (3–6 yrs)**: ${midMin} – ${midMax}/year\n`;
  if (seniorMin && seniorMax) out += `• **Senior / Lead**: ${seniorMin} – ${seniorMax}/year\n`;
  return out;
}

function generateDynamicCareerResponse(message, user, latestResult, topCareers, allCareers) {
  const q = message.toLowerCase().trim();
  const userName = user?.fullName?.split(' ')[0] || 'there';

  // 1. Direct career lookup in database
  const matchedCareer = allCareers.find((c) => {
    const t = c.title.toLowerCase();
    const id = c.id.toLowerCase().replace(/_/g, ' ');
    return q.includes(t) || q.includes(id) ||
      (t.includes('software') && q.includes('software')) ||
      (t.includes('data scientist') && (q.includes('data science') || q.includes('data scientist'))) ||
      (t.includes('machine learning') && (q.includes('ai') || q.includes('ml') || q.includes('machine learning'))) ||
      (t.includes('doctor') && (q.includes('doctor') || q.includes('mbbs') || q.includes('medical'))) ||
      (t.includes('accountant') && (q.includes('ca') || q.includes('chartered accountant'))) ||
      (t.includes('civil services') && (q.includes('ias') || q.includes('upsc') || q.includes('civil service') || q.includes('ips'))) ||
      (t.includes('defence') && (q.includes('defence') || q.includes('nda') || q.includes('army') || q.includes('navy') || q.includes('air force'))) ||
      (t.includes('architect') && q.includes('architect')) ||
      (t.includes('pilot') && (q.includes('pilot') || q.includes('aviation'))) ||
      (t.includes('game') && (q.includes('game') || q.includes('game dev'))) ||
      (t.includes('psychologist') && (q.includes('psycholog') || q.includes('mental health'))) ||
      (t.includes('lawyer') && (q.includes('law') || q.includes('lawyer') || q.includes('advocate') || q.includes('clat'))) ||
      (t.includes('fashion') && q.includes('fashion')) ||
      (t.includes('graphic') && (q.includes('graphic') || q.includes('ui/ux') || q.includes('design'))) ||
      (t.includes('physiotherapist') && q.includes('physio')) ||
      (t.includes('hotel') && (q.includes('hotel') || q.includes('hospitality'))) ||
      (t.includes('electrician') && (q.includes('electrician') || q.includes('iti'))) ||
      (t.includes('teacher') && (q.includes('teacher') || q.includes('teaching') || q.includes('professor')));
  });

  if (matchedCareer) {
    const det = typeof matchedCareer.details === 'object' && matchedCareer.details ? matchedCareer.details : {};
    const salaryText = formatSalary(det.salary);
    const exams = Array.isArray(det.exams) && det.exams.length ? det.exams.join(', ') : 'Direct admission / University CETs';
    const degrees = Array.isArray(det.degrees) && det.degrees.length ? det.degrees.join(', ') : 'Relevant Bachelor’s degree';
    const skills = Array.isArray(det.skills) && det.skills.length ? det.skills.slice(0, 5).join(', ') : 'Subject fundamentals and practical problem-solving';

    return `Here is a complete breakdown for **${matchedCareer.title}**:\n\n` +
      `📌 **Stream Required**: ${matchedCareer.stream}\n\n` +
      `📖 **Overview**: ${matchedCareer.description}\n\n` +
      `🎓 **Recommended Degrees**: ${degrees}\n\n` +
      `📝 **Key Entrance Exams**: ${exams}\n\n` +
      `💡 **Top Skills to Build**: ${skills}\n\n` +
      (salaryText ? `💰 **Salary Potential in India**:\n${salaryText}\n` : '') +
      `Would you like to know about top colleges, preparation timelines, or how your aptitude scores compare for this role?`;
  }

  // 2. Greetings
  if (/^(hi|hello|hey|greetings|namaste|good\s*(morning|afternoon|evening))/i.test(q)) {
    if (latestResult && topCareers.length > 0) {
      const topNames = topCareers.map(c => `**${c.title}** (${c.matchPct}% match)`).join(', ');
      return `Hello ${userName}! Great to chat with you.\n\nI see you've completed your aptitude assessment with an overall score of **${latestResult.overallScore}/100**. Your top career recommendations are ${topNames}.\n\nYou can ask me about:\n1. Detailed roadmaps for any of your recommended careers\n2. Entrance exam syllabus, timelines, and cutoff strategies (JEE, NEET, CUET, CLAT, etc.)\n3. Subject selection in Classes 11 & 12 (PCM vs PCB vs Commerce vs Arts)\n4. Salary trends and college admissions across India\n\nWhat would you like to explore first?`;
    }
    return `Hello ${userName}! I'm your PathFinder AI Career Counsellor.\n\nI can help you navigate subject streams, entrance exams, roadmaps, and career choices in India. Have you taken the 15-minute Aptitude Test yet? Taking it gives you personalized career match percentages! Otherwise, feel free to ask me anything about careers or streams.`;
  }

  // 3. Test results, recommendations, or scores
  if (q.includes('result') || q.includes('score') || q.includes('recommend') || q.includes('match') || q.includes('best for me') || q.includes('which career')) {
    if (latestResult && topCareers.length > 0) {
      const topList = topCareers.map((c, i) => `${i + 1}. **${c.title}** — **${c.matchPct}% match**`).join('\n');
      const strengths = Array.isArray(latestResult.strengths) && latestResult.strengths.length
        ? latestResult.strengths.map(s => s.replace(/_/g, ' ')).join(', ')
        : 'Analytical reasoning & structured problem-solving';

      return `Here is a summary of your assessment results, ${userName}:\n\n` +
        `🎯 **Overall Aptitude Score**: ${latestResult.overallScore}/100\n` +
        `💪 **Key Strengths**: ${strengths}\n\n` +
        `🏆 **Top 3 Recommended Careers**:\n${topList}\n\n` +
        `These matches are computed by blending your cognitive section scores with your Holland RIASEC occupational personality profile. Would you like a step-by-step roadmap for #1 (${topCareers[0].title})?`;
    }
    return `You haven't completed your aptitude assessment yet! Once you finish the 36 questions in the **Aptitude Test** tab, I will analyze your RIASEC personality and section strengths to recommend your top career matches. In the meantime, tell me which subjects you enjoy most in school!`;
  }

  // 4. Stream selection queries (Class 10/11)
  if (q.includes('stream') || q.includes('after 10') || q.includes('pcm') || q.includes('pcb') || q.includes('commerce') || q.includes('arts') || q.includes('humanities')) {
    return `Choosing the right stream in Class 11 is one of the most critical decisions for Indian students. Here is a clear comparison:\n\n` +
      `🔬 **Science (PCM)**: Physics, Chemistry, Maths.\n` +
      `• *Best for*: Engineering (JEE), Architecture (NATA), Aviation/Pilot (DGCA), Data Science, Defence (NDA).\n` +
      `• *Ideal if*: You enjoy numerical problem-solving and logical puzzles.\n\n` +
      `🧬 **Science (PCB)**: Physics, Chemistry, Biology.\n` +
      `• *Best for*: Medicine (NEET/MBBS), BDS, Biotechnology, Physiotherapy, Forensic Science.\n` +
      `• *Ideal if*: You have strong memory retention, visual learning, and a passion for life sciences.\n\n` +
      `📈 **Commerce (with/without Maths)**: Accounts, Business Studies, Economics.\n` +
      `• *Best for*: Chartered Accountancy (CA), Investment Banking, Corporate Finance, BBA/B.Com (CUET), Law.\n` +
      `• *Ideal if*: You enjoy financial systems, commerce, analytics, and business strategy.\n\n` +
      `🎨 **Arts / Humanities**: History, Political Science, Psychology, Sociology.\n` +
      `• *Best for*: Civil Services (UPSC), Law (CLAT), Design (NIFT/NID), Journalism, Public Policy.\n` +
      `• *Ideal if*: You love reading, writing, societal analysis, and creative expression.\n\n` +
      `Which stream are you currently leaning towards?`;
  }

  // 5. Entrance exams
  if (q.includes('exam') || q.includes('jee') || q.includes('neet') || q.includes('cuet') || q.includes('clat') || q.includes('nda') || q.includes('upsc')) {
    return `Major competitive entrance exams in India and their target paths:\n\n` +
      `• **JEE Main & Advanced**: For B.Tech / B.E. admissions to IITs, NITs, and IIITs. (Class 12 PCM required).\n` +
      `• **NEET-UG**: The single medical entrance exam for MBBS, BDS, AYUSH, and veterinary seats across India. (Class 12 PCB required).\n` +
      `• **CUET-UG**: Gateway to Central Universities (Delhi University, BHU, JNU) for B.A., B.Com, and B.Sc. programmes.\n` +
      `• **CLAT**: For 5-year integrated law degrees (BA LLB / BBA LLB) at National Law Universities (NLUs).\n` +
      `• **NDA (UPSC)**: Entrance to the National Defence Academy for Army, Navy, and Air Force officer cadets.\n` +
      `• **NATA / JEE Paper 2**: Required for B.Arch (Architecture) degree programmes.\n\n` +
      `Which specific exam would you like preparation tips or syllabus details for?`;
  }

  // 6. High salary / Money questions
  if (q.includes('salary') || q.includes('highest paying') || q.includes('earn') || q.includes('money') || q.includes('package')) {
    return `In India, some of the fastest-growing and highest-paying career trajectories right now include:\n\n` +
      `1. **AI & Machine Learning / Data Science**: Entry: ₹8L – ₹18L/yr; Mid-career: ₹22L – ₹45L+/yr.\n` +
      `2. **Software & Cloud Engineering**: Entry: ₹6L – ₹14L/yr; Mid-career: ₹18L – ₹35L/yr.\n` +
      `3. **Commercial Pilot**: Entry: ₹15L – ₹24L/yr; Captains: ₹50L – ₹90L+/yr.\n` +
      `4. **Chartered Accountant / Investment Banking**: Entry: ₹8L – ₹15L/yr; Partners: ₹30L – ₹60L+/yr.\n` +
      `5. **Corporate Lawyer**: Entry: ₹7L – ₹16L/yr; Senior Associates: ₹25L – ₹50L+/yr.\n\n` +
      `*Note: Top salaries correlate directly with specialised skills, high-tier institute pedigree, and consistent problem-solving ability.* Which industry interests you most?`;
  }

  // 7. Colleges / Admissions
  if (q.includes('college') || q.includes('university') || q.includes('iit') || q.includes('nit') || q.includes('aiims') || q.includes('du')) {
    return `Top undergraduate educational institutions in India by discipline:\n\n` +
      `• **Engineering**: IIT Bombay, IIT Delhi, IIT Madras, BITS Pilani, NIT Trichy, IIIT Hyderabad.\n` +
      `• **Medicine**: AIIMS New Delhi, CMC Vellore, JIPMER, KGMU Lucknow, AFMC Pune.\n` +
      `• **Commerce & Economics**: SRCC (Delhi University), St. Xavier's Mumbai, Loyola College Chennai, Shaheed Sukhdev.\n` +
      `• **Law**: NLSIU Bengaluru, NALSAR Hyderabad, WBNUJS Kolkata, NLU Delhi.\n` +
      `• **Design & Creative**: NID Ahmedabad, NIFT Delhi/Mumbai, IIT Bombay (IDC).\n\n` +
      `Tell me what branch or city you are targeting, and I can tell you about admission requirements and cutoff trends!`;
  }

  // 8. Dynamic contextual response for any other topic
  const topMention = topCareers.length > 0 ? topCareers[0].title : null;
  return `That's a great question about **"${message.length > 60 ? message.substring(0, 57) + '...' : message}"**, ${userName}.\n\n` +
    `When evaluating this path, consider three key pillars:\n` +
    `1. **Academic Foundation**: Ensure your Class 11–12 subject combination directly satisfies the eligibility criteria for corresponding degrees.\n` +
    `2. **Milestone Exams**: Identify the national or state entrance tests required (e.g., CUET, JEE, NEET, or institutional entrance tests) at least 18 months ahead.\n` +
    `3. **Hands-on Exposure**: Work on real-world projects, participate in competitions, and shadow professionals to confirm genuine interest.\n\n` +
    (topMention ? `Given your high alignment with **${topMention}**, exploring how this connects with your top career match could give you a unique edge.\n\n` : '') +
    `Could you tell me what Class you are currently in and which specific aspects (colleges, daily work, or exams) you would like to know more about?`;
}

router.post('/', asyncHandler(async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) throw httpError(422, 'message is required');
  if (message.length > 4000) throw httpError(422, 'message must be 4000 characters or fewer');

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Load user assessment results, career database, and recent chat history in parallel
  const [latestResult, allCareers, recentChats] = await Promise.all([
    prisma.testResult.findFirst({
      where: { attempt: { userId: req.user.id } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.career.findMany(),
    prisma.chatMessage.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  let topCareers = [];
  if (latestResult) {
    const sectionScores = latestResult.sectionScores || {};
    const riasecScores = latestResult.riasecScores || {};
    topCareers = allCareers.map((career) => {
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
        id: career.id,
        title: career.title,
        matchPct: Math.round(0.5 * riasecMatch + 0.5 * aptitudeMatch),
      };
    }).sort((a, b) => b.matchPct - a.matchPct).slice(0, 3);
  }

  let reply = '';

  // 1. Try Gemini API if key is present
  if (apiKey && apiKey.length > 10) {
    const context = latestResult
      ? `Student test score: ${latestResult.overallScore}/100. RIASEC profile: ${JSON.stringify(latestResult.riasecScores)}. Section scores: ${JSON.stringify(latestResult.sectionScores)}. Top career matches: ${topCareers.map((c) => `${c.title} (${c.matchPct}%)`).join(', ')}. Grade: ${req.user.grade || '11/12'}, Board: ${req.user.board || 'CBSE'}.`
      : `The student has not completed the aptitude test yet. Grade: ${req.user.grade || '10-12'}, Board: ${req.user.board || 'CBSE'}. Give clear, tailored guidance.`;

    const systemPrompt = `You are PathFinder, a world-class, empathetic, and knowledgeable AI career counsellor for Indian school and college students (classes 8-12 and undergrad).
Give direct, thoughtful, well-formatted answers with bullet points and bold text where helpful.
Answer the student's exact question thoroughly, factoring in Indian education streams (PCM, PCB, Commerce, Arts), entrance exams (JEE, NEET, CUET, CLAT, NDA, NIFT, NATA, etc.), colleges, and realistic salary benchmarks in INR.
Student Context: ${context}`;

    // Format chat history for Gemini multi-turn conversation
    const historyTurns = [...recentChats].reverse().map((c) => ({
      role: c.role === 'student' ? 'user' : 'model',
      parts: [{ text: c.content }],
    }));

    historyTurns.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const modelsToTry = [
      process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ];

    for (const model of [...new Set(modelsToTry)]) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const aiResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: historyTurns,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
          }),
        });

        if (aiResponse.ok) {
          const payload = await aiResponse.json();
          reply = payload.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? '')
            .join('\n')
            .trim();
          if (reply) break;
        } else {
          const errText = await aiResponse.text();
          console.warn(`Gemini API error with model ${model}:`, errText);
        }
      } catch (geminiErr) {
        console.warn(`Gemini network call error with model ${model}:`, geminiErr.message);
      }
    }
  }

  // 2. Dynamic, comprehensive fallback counsellor if Gemini key is missing or unavailable
  if (!reply) {
    reply = generateDynamicCareerResponse(message, req.user, latestResult, topCareers, allCareers);
  }

  // Persist conversation
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