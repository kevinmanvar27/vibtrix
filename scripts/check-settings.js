// This script checks the current site settings in the database
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking site settings...');

    // Get settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    console.log('Current settings:', {
      ...settings,
      razorpayKeySecret: settings.razorpayKeySecret ? '********' : null,
    });

    // Check if Razorpay columns exist
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'site_settings' 
        AND column_name IN ('razorpayKeyId', 'razorpayKeySecret')
      `;
      console.log('Razorpay columns:', result);
    } catch (error) {
      console.error('Error checking Razorpay columns:', error);
    }
  } catch (error) {
    console.error('Error checking site settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
