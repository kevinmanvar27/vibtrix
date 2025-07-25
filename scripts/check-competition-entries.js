// This script checks all competition entries in the database

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking competition entries...');

    // Get all competition entries
    const entries = await prisma.competitionRoundEntry.findMany({
      include: {
        round: {
          select: {
            id: true,
            name: true,
            competitionId: true,
            competition: {
              select: {
                title: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        participant: {
          select: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${entries.length} competition entries`);

    // Group entries by competition
    const entriesByCompetition = {};
    entries.forEach(entry => {
      const competitionId = entry.round.competitionId;
      const competitionTitle = entry.round.competition.title;
      
      if (!entriesByCompetition[competitionId]) {
        entriesByCompetition[competitionId] = {
          title: competitionTitle,
          entries: [],
        };
      }
      
      entriesByCompetition[competitionId].entries.push(entry);
    });

    // Print entries by competition
    console.log('\nEntries by competition:');
    Object.entries(entriesByCompetition).forEach(([competitionId, competition]) => {
      console.log(`\nCompetition: "${competition.title}" (ID: ${competitionId})`);
      console.log(`Total entries: ${competition.entries.length}`);
      
      // Group entries by round
      const entriesByRound = {};
      competition.entries.forEach(entry => {
        const roundId = entry.roundId;
        const roundName = entry.round.name;
        
        if (!entriesByRound[roundId]) {
          entriesByRound[roundId] = {
            name: roundName,
            entries: [],
          };
        }
        
        entriesByRound[roundId].entries.push(entry);
      });
      
      // Print entries by round
      Object.entries(entriesByRound).forEach(([roundId, round]) => {
        console.log(`\n  Round: "${round.name}" (ID: ${roundId})`);
        console.log(`  Total entries: ${round.entries.length}`);
        
        round.entries.forEach(entry => {
          const username = entry.participant.user.username;
          const postId = entry.postId;
          const visibleInCompetitionFeed = entry.visibleInCompetitionFeed;
          const visibleInNormalFeed = entry.visibleInNormalFeed;
          
          console.log(`  - User: ${username}, Post: ${postId || 'None'}, visibleInCompetitionFeed: ${visibleInCompetitionFeed}, visibleInNormalFeed: ${visibleInNormalFeed}`);
        });
      });
    });

  } catch (error) {
    console.error('Error checking competition entries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
