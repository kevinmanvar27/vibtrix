const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Get all advertisements
    const advertisements = await prisma.advertisement.findMany({
      include: {
        media: true,
      },
    });

    console.log(`Found ${advertisements.length} advertisements`);

    // Check each advertisement's media
    for (const ad of advertisements) {
      console.log(`\nAdvertisement: ${ad.id} - ${ad.title}`);
      console.log(`Status: ${ad.status}`);
      console.log(`Schedule: ${ad.scheduleDate} to ${ad.expiryDate}`);
      
      if (!ad.media) {
        console.log(`ERROR: Media not found for advertisement ${ad.id}`);
        continue;
      }
      
      console.log(`Media ID: ${ad.media.id}`);
      console.log(`Media URL: ${ad.media.url}`);
      console.log(`Media Type: ${ad.media.type}`);
      
      // Check if the media file exists
      const mediaPath = ad.media.url;
      if (mediaPath.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', mediaPath);
        const exists = fs.existsSync(localPath);
        console.log(`Media file exists: ${exists ? 'YES' : 'NO - ' + localPath}`);
      } else {
        console.log(`Media is not a local file: ${mediaPath}`);
      }
    }
  } catch (error) {
    console.error("Error checking advertisement media:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
