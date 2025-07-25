const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Add the advertisementsEnabled column if it doesn't exist
    await prisma.$executeRaw`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "advertisementsEnabled" BOOLEAN NOT NULL DEFAULT true`;
    console.log('Column "advertisementsEnabled" added successfully');
    
    // Generate Prisma client with the updated schema
    console.log('Regenerating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma client regenerated successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
