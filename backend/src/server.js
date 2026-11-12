import 'dotenv/config';
import app from './app.js';
import { prisma } from './db.js';

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`PathFinder API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
