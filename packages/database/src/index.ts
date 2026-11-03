import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function findDatabasePath(): string {
  let current = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(current, 'packages', 'database', 'prisma', 'dev.db');
    if (fs.existsSync(candidate)) {
      return candidate.replace(/\\/g, '/');
    }
    const directCandidate = path.join(current, 'prisma', 'dev.db');
    if (fs.existsSync(directCandidate)) {
      return directCandidate.replace(/\\/g, '/');
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  current = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidateDir = path.join(current, 'packages', 'database', 'prisma');
    if (fs.existsSync(candidateDir)) {
      return path.join(candidateDir, 'dev.db').replace(/\\/g, '/');
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return path.resolve(process.cwd(), 'packages/database/prisma/dev.db').replace(/\\/g, '/');
}

function getPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.startsWith('file:')) {
    const absoluteDbPath = findDatabasePath();
    return new PrismaClient({
      datasourceUrl: `file:${absoluteDbPath}`,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

globalForPrisma.prisma = prisma;

export * from '@prisma/client';
export default prisma;
