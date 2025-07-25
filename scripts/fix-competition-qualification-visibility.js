// This script fixes the visibility settings for competition entries based on qualification status
// It ensures that posts from disqualified participants are only visible in the normal feed, not in the competition feed
// Usage: node scripts/fix-competition-qualification-visibility.js <competitionId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID from command line arguments
    const competitionId = process.argv[2];
    
    if (!competitionId) {
      console.error('Error: Competition ID is required');
      console.log('Usage: node scripts/fix-competition-qualification-visibility.js <competitionId>');
      process.exit(1);
    }

    console.log(`Fixing competition qualification visibility for competition: ${competitionId}`);

    // Check if the competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      console.error(`Error: Competition with ID ${competitionId} not found`);
      process.exit(1);
    }

    console.log(`Found competition: "${competition.title}" with ${competition.rounds.length} rounds`);

    // Process each round except the first one
    for (let i = 1; i < competition.rounds.length; i++) {
      const round = competition.rounds[i];
      const previousRound = competition.rounds[i - 1];
      
      console.log(`\nProcessing Round ${i + 1}: "${round.name}"`);
      console.log(`Previous Round: "${previousRound.name}"`);
      
      // Find disqualified participants from the previous round
      const disqualifiedEntries = await prisma.competitionRoundEntry.findMany({
        where: {
          roundId: previousRound.id,
          qualifiedForNextRound: false,
        },
        include: {
          participant: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });
      
      console.log(`Found ${disqualifiedEntries.length} disqualified entries in previous round`);
      
      // For each disqualified participant, find their entries in the current round
      for (const disqualifiedEntry of disqualifiedEntries) {
        const participantId = disqualifiedEntry.participantId;
        const username = disqualifiedEntry.participant.user.username;
        
        // Find entries in the current round for this participant
        const currentRoundEntries = await prisma.competitionRoundEntry.findMany({
          where: {
            participantId,
            roundId: round.id,
            postId: { not: null }, // Only entries with posts
          },
        });
        
        if (currentRoundEntries.length > 0) {
          console.log(`\nUser ${username} was disqualified in previous round but has ${currentRoundEntries.length} entries in current round`);
          
          // Update each entry to be visible only in the normal feed, not in the competition feed
          for (const entry of currentRoundEntries) {
            if (entry.visibleInCompetitionFeed) {
              console.log(`Updating entry ${entry.id} to be visible only in normal feed`);
              
              await prisma.competitionRoundEntry.update({
                where: { id: entry.id },
                data: {
                  visibleInCompetitionFeed: false,
                  visibleInNormalFeed: true,
                },
              });
              
              console.log(`Entry ${entry.id} updated successfully`);
            } else {
              console.log(`Entry ${entry.id} is already correctly configured (not visible in competition feed)`);
            }
          }
        }
      }
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
