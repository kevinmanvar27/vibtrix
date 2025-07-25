// This script resets the visibility settings for all competition entries
// It sets visibleInCompetitionFeed based on qualification status
// Usage: node scripts/reset-competition-visibility.js <competitionId>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID from command line arguments
    const competitionId = process.argv[2];
    
    if (!competitionId) {
      console.error('Error: Competition ID is required');
      console.log('Usage: node scripts/reset-competition-visibility.js <competitionId>');
      process.exit(1);
    }

    console.log(`Resetting competition visibility for competition: ${competitionId}`);

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

    // Process each round
    for (let i = 0; i < competition.rounds.length; i++) {
      const round = competition.rounds[i];
      console.log(`\nProcessing Round ${i + 1}: "${round.name}"`);
      
      // Get all entries for this round
      const entries = await prisma.competitionRoundEntry.findMany({
        where: {
          roundId: round.id,
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
      
      console.log(`Found ${entries.length} entries for this round`);
      
      // Process each entry
      for (const entry of entries) {
        console.log(`\nProcessing entry for user: ${entry.participant.user.username}`);
        
        // If this is the first round, all entries should be visible in the competition feed
        if (i === 0) {
          console.log(`This is the first round, entry should be visible in the competition feed`);
          
          await prisma.competitionRoundEntry.update({
            where: { id: entry.id },
            data: {
              visibleInCompetitionFeed: true,
              visibleInNormalFeed: true,
            },
          });
          
          console.log(`Updated entry: visibleInCompetitionFeed=true, visibleInNormalFeed=true`);
        }
        // For subsequent rounds, check if the user was qualified in the previous round
        else {
          const previousRound = competition.rounds[i - 1];
          
          // Get the entry for the previous round
          const previousEntry = await prisma.competitionRoundEntry.findFirst({
            where: {
              participantId: entry.participantId,
              roundId: previousRound.id,
            },
          });
          
          // If there's no previous entry or the user was not qualified, 
          // they should not be visible in the competition feed for this round
          if (!previousEntry || previousEntry.qualifiedForNextRound === false) {
            console.log(`User was not qualified for this round, entry should not be visible in the competition feed`);
            
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: false,
                visibleInNormalFeed: true,
              },
            });
            
            console.log(`Updated entry: visibleInCompetitionFeed=false, visibleInNormalFeed=true`);
          }
          // If the user was qualified, they should be visible in the competition feed for this round
          else if (previousEntry.qualifiedForNextRound === true) {
            console.log(`User was qualified for this round, entry should be visible in the competition feed`);
            
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: true,
                visibleInNormalFeed: true,
              },
            });
            
            console.log(`Updated entry: visibleInCompetitionFeed=true, visibleInNormalFeed=true`);
          }
          // If the qualification status is null, we can't determine if they should be visible
          // So we'll make them visible in the competition feed for now
          else {
            console.log(`User's qualification status is unknown, entry will be visible in the competition feed`);
            
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: true,
                visibleInNormalFeed: true,
              },
            });
            
            console.log(`Updated entry: visibleInCompetitionFeed=true, visibleInNormalFeed=true`);
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
