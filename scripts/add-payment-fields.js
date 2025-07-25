// scripts/add-payment-fields.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Execute raw SQL to add the missing columns one by one
    console.log('Adding orderId column...');
    await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "orderId" TEXT`;

    console.log('Adding paymentId column...');
    await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "paymentId" TEXT`;

    console.log('Adding signature column...');
    await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "signature" TEXT`;

    console.log('Adding qrCode column...');
    await prisma.$executeRaw`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "qrCode" TEXT`;

    console.log('Copying data from transactionId to orderId...');
    await prisma.$executeRaw`UPDATE payments SET "orderId" = "transactionId" WHERE "orderId" IS NULL AND "transactionId" IS NOT NULL`;

    console.log('Migration completed successfully');
    return 'Success';
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Script failed:', e);
    process.exit(1);
  });
