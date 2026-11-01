const fs = require('fs');
const path = require('path');

function syncPrismaProvider(databaseUrl) {
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  if (!fs.existsSync(schemaPath)) return;

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const isPostgres = Boolean(
    databaseUrl &&
    (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))
  );
  const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

  const currentProviderMatch = schemaContent.match(/provider\s*=\s*"(sqlite|postgresql)"/);
  if (currentProviderMatch && currentProviderMatch[1] !== targetProvider) {
    console.log(`[prisma-sync] Updating datasource provider from "${currentProviderMatch[1]}" to "${targetProvider}"`);
    const updated = schemaContent.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
    fs.writeFileSync(schemaPath, updated, 'utf-8');
  }
}

module.exports = { syncPrismaProvider };

