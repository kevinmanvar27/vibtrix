// This script adds the showFeedStickers column to the site_settings table
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // First, check if the settings record exists
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
    });

    if (!settings) {
      console.log('Creating settings record...');
      // Create the settings record if it doesn't exist
      await prisma.siteSettings.create({
        data: {
          id: 'settings',
          showFeedStickers: true,
        },
      });
      console.log('Settings record created with showFeedStickers column.');
    } else {
      console.log('Settings record exists, updating schema...');
      
      // Try to update the record to ensure the column exists
      try {
        await prisma.$executeRaw`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showFeedStickers" BOOLEAN NOT NULL DEFAULT true;`;
        console.log('Column added successfully.');
      } catch (error) {
        console.error('Error adding column:', error);
      }
      
      // Update the record with the new field
      await prisma.siteSettings.update({
        where: { id: 'settings' },
        data: { showFeedStickers: true },
      });
      console.log('Settings record updated with showFeedStickers value.');
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
