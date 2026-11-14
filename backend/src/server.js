import 'dotenv/config';
import app from './app.js';
import { prisma } from './db.js';

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`PathFinder API listening on http://localhost:${port}`);
});

// Keep process active in non-interactive / daemon environments
const keepAlive = setInterval(() => {}, 60000);

async function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  clearInterval(keepAlive);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
