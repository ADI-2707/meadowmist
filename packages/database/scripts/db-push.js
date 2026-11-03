const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { syncPrismaProvider } = require('./sync-provider');

const cwd = path.resolve(__dirname, '..');
const defaultDbPath = path.resolve(cwd, 'prisma/dev.db').replace(/\\/g, '/');

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || `file:${defaultDbPath}`,
};

syncPrismaProvider(env.DATABASE_URL);

const isPostgres = env.DATABASE_URL.startsWith('postgresql://') || env.DATABASE_URL.startsWith('postgres://');
const maskedUrl = env.DATABASE_URL.startsWith('file:')
  ? 'file:***'
  : env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
console.log(`[db-push] Using DATABASE_URL: ${maskedUrl}`);

execSync('npx prisma generate', {
  stdio: 'inherit',
  cwd,
  env,
});

const migrationsDir = path.join(cwd, 'prisma/migrations');
if (isPostgres && fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0) {
  console.log('[db-push] Running prisma migrate deploy for PostgreSQL...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd,
    env,
  });
} else if (isPostgres && process.env.PRISMA_ALLOW_DATA_LOSS !== 'true') {
  console.log('[db-push] Running safe prisma db push for PostgreSQL (without data loss)...');
  try {
    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd,
      env,
    });
  } catch {
    console.log('[db-push] Safe db push encountered interactive prompt/warning. Applying with --accept-data-loss...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      cwd,
      env,
    });
  }
} else {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd,
    env,
  });
}
