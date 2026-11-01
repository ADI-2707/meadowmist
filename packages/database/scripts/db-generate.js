const { execSync } = require('child_process');
const path = require('path');
const { syncPrismaProvider } = require('./sync-provider');

const cwd = path.resolve(__dirname, '..');
const defaultDbPath = path.resolve(cwd, 'prisma/dev.db').replace(/\\/g, '/');
const dbUrl = process.env.DATABASE_URL || `file:${defaultDbPath}`;

syncPrismaProvider(dbUrl);

execSync('npx prisma generate', {
  stdio: 'inherit',
  cwd,
  env: {
    ...process.env,
    DATABASE_URL: dbUrl,
  },
});

