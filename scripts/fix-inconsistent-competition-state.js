// Script to fix inconsistent competition states
// Usage: node scripts/fix-inconsistent-competition-state.js [competitionId]

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixInconsistentCompetitionState(competitionId) {
  console.log('🔧 Fixing Inconsistent Competition States');
  console.log('=======================================\n');

  try {
    // Find competitions with inconsistent states
    const whereClause = competitionId 
      ? { id: competitionId }
      : {
          OR: [
            // Case 1: Has completion reason but still active
            {
              isActive: true,
              completionReason: { not: null }
            },
            // Case 2: Not active but no completion reason
            {
              isActive: false,
              completionReason: null
            }
          ]
        };

    const inconsistentCompetitions = await prisma.competition.findMany({
      where: whereClause,
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    console.log(`🔍 Found ${inconsistentCompetitions.length} competitions with inconsistent states`);

    if (inconsistentCompetitions.length === 0) {
      console.log('✅ No inconsistent competitions found');
      return;
    }

    for (const competition of inconsistentCompetitions) {
      console.log(`\n🏆 Processing: ${competition.title} (ID: ${competition.id})`);
      console.log(`   Current state: isActive=${competition.isActive}, completionReason=${competition.completionReason || 'null'}`);

      const currentTime = new Date();
      let shouldBeTerminated = false;
      let newCompletionReason = null;

      // Check termination conditions
      
      // CONDITION 1: Has completion reason but still active
      if (competition.isActive && competition.completionReason) {
        console.log('   🔧 Issue: Has completion reason but still active');
        shouldBeTerminated = true;
        newCompletionReason = competition.completionReason;
      }
      
      // CONDITION 2: Check if should be terminated based on business logic
      else if (competition.isActive && !competition.completionReason) {
        // Check first round no participants condition
        const firstRound = competition.rounds[0];
        if (firstRound && new Date(firstRound.endDate) < currentTime) {
          const participantCount = competition._count.participants;
          
          if (participantCount < 1) {
            console.log('   🔧 Issue: First round ended with no participants');
            shouldBeTerminated = true;
            newCompletionReason = "No one joined this competition, that's why it ended.";
          }
        }

        // Check no qualifying participants condition
        if (!shouldBeTerminated) {
          for (const round of competition.rounds) {
            const roundEnded = new Date(round.endDate) < currentTime;
            const likesToPass = round.likesToPass || 0;
            
            if (roundEnded && likesToPass > 0) {
              const entriesWithPosts = await prisma.competitionRoundEntry.findMany({
                where: {
                  roundId: round.id,
                  postId: { not: null }
                },
                include: {
                  post: {
                    include: {
                      _count: { select: { likes: true } }
                    }
                  }
                }
              });
              
              const entriesWithRequiredLikes = entriesWithPosts.filter(entry => 
                entry.post && entry.post._count.likes >= likesToPass
              ).length;
              
              if (entriesWithPosts.length > 0 && entriesWithRequiredLikes === 0) {
                console.log(`   🔧 Issue: ${round.name} ended with no qualifying participants`);
                shouldBeTerminated = true;
                newCompletionReason = `${round.name} required ${likesToPass} likes but no participant achieved this target, so the competition has been ended.`;
                break;
              }
            }
          }
        }
      }

      // Apply fixes
      if (shouldBeTerminated) {
        console.log(`   ✅ Terminating competition with reason: "${newCompletionReason}"`);
        
        // Update competition
        await prisma.competition.update({
          where: { id: competition.id },
          data: {
            isActive: false,
            completionReason: newCompletionReason,
          },
        });

        // Make all posts visible in normal feed
        await prisma.competitionRoundEntry.updateMany({
          where: {
            round: {
              competitionId: competition.id,
            },
            postId: { not: null },
          },
          data: {
            visibleInNormalFeed: true,
          },
        });

        console.log('   ✅ Updated competition state and post visibility');
      } else {
        console.log('   ❌ No termination conditions met - competition should remain active');
        
        // If competition is not active but has no completion reason, make it active
        if (!competition.isActive && !competition.completionReason) {
          console.log('   🔧 Making competition active (no completion reason found)');
          
          await prisma.competition.update({
            where: { id: competition.id },
            data: {
              isActive: true,
            },
          });
        }
      }
    }

    // Verification
    console.log('\n🔍 Verification after fixes:');
    
    const verificationCompetitions = await prisma.competition.findMany({
      where: competitionId ? { id: competitionId } : { id: { in: inconsistentCompetitions.map(c => c.id) } },
      select: {
        id: true,
        title: true,
        isActive: true,
        completionReason: true,
      }
    });

    verificationCompetitions.forEach(comp => {
      const isConsistent = (comp.isActive && !comp.completionReason) || (!comp.isActive && comp.completionReason);
      console.log(`   ${comp.title}: isActive=${comp.isActive}, hasReason=${!!comp.completionReason} ${isConsistent ? '✅' : '❌'}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('1. Clear browser cache (Ctrl+Shift+R)');
    console.log('2. Refresh competition pages');
    console.log('3. Verify round selector shows correct icons');
    console.log('4. Check debug info shows isTerminated=YES for terminated competitions');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const competitionId = process.argv[2];
  
  if (competitionId) {
    console.log(`🎯 Fixing specific competition: ${competitionId}`);
  } else {
    console.log('🎯 Fixing all competitions with inconsistent states');
  }
  
  await fixInconsistentCompetitionState(competitionId);
}

main().catch(console.error);
