import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import seedData from './seed-data.json' with { type: 'json' };

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PathFinder database...');

  for (const section of seedData.sections) {
    await prisma.testSection.upsert({
      where: { id: section.id },
      update: {
        label: section.label,
        description: section.description,
        questionCount: section.questionCount,
        type: section.type,
      },
      create: {
        id: section.id,
        label: section.label,
        description: section.description,
        questionCount: section.questionCount,
        type: section.type,
      },
    });
  }

  for (const question of seedData.questions) {
    await prisma.question.upsert({
      where: { id: question.id },
      update: {
        sectionId: question.section,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
      },
      create: {
        id: question.id,
        sectionId: question.section,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
      },
    });
  }

  for (const career of seedData.careers) {
    await prisma.career.upsert({
      where: { id: career.id },
      update: {
        title: career.title,
        stream: career.stream,
        icon: career.icon,
        description: career.description,
        riasecTypes: career.riasecTypes,
        requiredAptitudes: career.requiredAptitudes,
        details: career,
      },
      create: {
        id: career.id,
        title: career.title,
        stream: career.stream,
        icon: career.icon,
        description: career.description,
        riasecTypes: career.riasecTypes,
        requiredAptitudes: career.requiredAptitudes,
        details: career,
      },
    });
  }

  const passwordHash = await bcrypt.hash('demo123', 12);
  await prisma.user.upsert({
    where: { email: 'demo@pathfinder.in' },
    update: {},
    create: {
      id: 'usr_001',
      fullName: 'Demo Student',
      email: 'demo@pathfinder.in',
      passwordHash,
      phone: '9876543210',
      grade: '12',
      board: 'CBSE',
      schoolName: 'Delhi Public School, R.K. Puram',
      state: 'Delhi',
      preferredLanguage: 'English',
      interests: ['coding', 'maths', 'design'],
      dob: new Date('2008-03-15T00:00:00.000Z'),
      subjectMarks: {
        maths: 85,
        science: 78,
        english: 91,
        socialScience: 72,
        secondLanguage: 88,
        computer: 95,
      },
      createdAt: new Date('2024-08-01T10:30:00.000Z'),
    },
  });

  console.log(`Seeded ${seedData.sections.length} sections, ${seedData.questions.length} questions, ${seedData.careers.length} careers.`);
  console.log('Demo account: demo@pathfinder.in / demo123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
