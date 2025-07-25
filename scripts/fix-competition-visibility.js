const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompetitionVisibility() {
  try {
    console.log('Starting to fix competition visibility...');
    const currentDate = new Date();
    
    // Find all active competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc'
          }
        }
      }
    });
    
    console.log(`Found ${activeCompetitions.length} active competitions`);
    
    for (const comp of activeCompetitions) {
      console.log(`\nProcessing competition: ${comp.title} (ID: ${comp.id})`);
      
      // Process each round
      for (const round of comp.rounds) {
        const hasStarted = new Date(round.startDate) <= currentDate;
        
        console.log(`\nRound: ${round.name} (ID: ${round.id})`);
        console.log(`Has started: ${hasStarted}`);
        
        // Get entries for this round
        const entries = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: round.id,
            postId: { not: null } // Only entries with posts
          },
          include: {
            participant: {
              select: {
                user: {
                  select: {
                    username: true
                  }
                }
              }
            }
          }
        });
        
        console.log(`Found ${entries.length} entries with posts for this round`);
        
        // Update visibility for each entry
        for (const entry of entries) {
          // If the round has started, posts should be visible
          const shouldBeVisible = hasStarted;
          
          if (entry.visibleInCompetitionFeed !== shouldBeVisible || entry.visibleInNormalFeed !== shouldBeVisible) {
            console.log(`Updating entry ${entry.id} for user ${entry.participant.user.username}:`);
            console.log(`  Current: visibleInCompetitionFeed=${entry.visibleInCompetitionFeed}, visibleInNormalFeed=${entry.visibleInNormalFeed}`);
            console.log(`  New: visibleInCompetitionFeed=${shouldBeVisible}, visibleInNormalFeed=${shouldBeVisible}`);
            
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: shouldBeVisible,
                visibleInNormalFeed: shouldBeVisible
              }
            });
            
            console.log('  Entry updated successfully');
          } else {
            console.log(`Entry ${entry.id} for user ${entry.participant.user.username} already has correct visibility settings`);
          }
        }
      }
    }
    
    console.log('\nCompetition visibility fix completed successfully');
  } catch (error) {
    console.error('Error fixing competition visibility:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompetitionVisibility();
