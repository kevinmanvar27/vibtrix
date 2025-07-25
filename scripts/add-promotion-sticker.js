// Script to add a promotion sticker to a competition
const { PrismaClient, StickerPosition } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all active competitions
    const competitions = await prisma.competition.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (competitions.length === 0) {
      console.log('No active competitions found. Creating a test competition...');
      
      // Create a test competition if none exists
      const newCompetition = await prisma.competition.create({
        data: {
          title: 'Test Competition',
          description: 'This is a test competition for sticker testing',
          mediaType: 'BOTH',
          isActive: true,
          rounds: {
            create: [
              {
                name: 'Round 1',
                startDate: new Date(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                likesToPass: 10,
              },
            ],
          },
        },
      });
      
      console.log(`Created test competition: ${newCompetition.id}`);
      competitions.push({ id: newCompetition.id, title: 'Test Competition' });
    }

    // Use the first competition
    const competitionId = competitions[0].id;
    console.log(`Using competition: ${competitions[0].title} (${competitionId})`);

    // Check if the competition already has promotion stickers
    const existingStickers = await prisma.promotionSticker.findMany({
      where: {
        competitionId,
      },
    });

    console.log(`Found ${existingStickers.length} existing promotion stickers`);

    // Create a new promotion sticker
    const stickerUrl = '/uploads/stickers/test-sticker.svg';
    
    const newSticker = await prisma.promotionSticker.create({
      data: {
        title: 'Test Promotion Sticker',
        imageUrl: stickerUrl,
        position: 'TOP_RIGHT',
        limit: null, // No usage limit
        isActive: true,
        competitionId,
      },
    });

    console.log(`Created new promotion sticker: ${newSticker.id}`);
    console.log('Sticker details:', newSticker);

    console.log('Done! You can now test uploading a post to this competition.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
