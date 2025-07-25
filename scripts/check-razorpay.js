// This script checks the Razorpay settings in the database
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Razorpay settings...');

    // Get settings with a raw query to ensure we see all fields
    const result = await prisma.$queryRaw`
      SELECT 
        "razorpayEnabled", 
        "razorpayKeyId", 
        "razorpayKeySecret",
        CASE WHEN "razorpayKeyId" IS NULL THEN 'MISSING' ELSE 'PRESENT' END as key_id_status,
        CASE WHEN "razorpayKeySecret" IS NULL THEN 'MISSING' ELSE 'PRESENT' END as key_secret_status
      FROM site_settings 
      WHERE id = 'settings'
    `;

    console.log('Razorpay settings:', result);

    // Also check environment variables
    console.log('Environment variables:');
    console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'PRESENT' : 'MISSING');
    console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'PRESENT' : 'MISSING');
  } catch (error) {
    console.error('Error checking Razorpay settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
