const { execSync } = require('child_process');
const path = require('path');
const { syncPrismaProvider } = require('./sync-provider');

const cwd = path.resolve(__dirname, '..');
const defaultDbPath = path.resolve(cwd, 'prisma/dev.db').replace(/\\/g, '/');

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || `file:${defaultDbPath}`,
};

syncPrismaProvider(env.DATABASE_URL);

const maskedUrl = env.DATABASE_URL.startsWith('file:')
  ? 'file:***'
  : env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
console.log(`[db-push] Using DATABASE_URL: ${maskedUrl}`);

execSync('npx prisma generate', {
  stdio: 'inherit',
  cwd,
  env,
});

execSync('npx prisma db push --accept-data-loss', {
  stdio: 'inherit',
  cwd,
  env,
});
