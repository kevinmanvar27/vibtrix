// Script to manually force process all competitions immediately
// This bypasses the cron schedule and processes competitions right now
// Usage: node scripts/force-process-competitions.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function forceProcessCompetitions() {
  console.log('🔄 Force Processing All Competitions');
  console.log('===================================\n');

  try {
    const currentDate = new Date();
    console.log(`📅 Current time: ${currentDate.toISOString()}`);

    // Find all active competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        completionReason: null,
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    console.log(`🔍 Found ${activeCompetitions.length} active competitions to check\n`);

    const processedCompetitions = [];

    for (const competition of activeCompetitions) {
      console.log(`🏆 Processing: ${competition.title} (ID: ${competition.id})`);

      // EXACT CONDITION: If first round end date/time < now && total participants < 1
      const firstRound = competition.rounds[0];
      if (firstRound) {
        console.log(`   📅 First round: ${firstRound.name}`);
        console.log(`   📅 End date: ${new Date(firstRound.endDate).toISOString()}`);
        console.log(`   📅 Has ended: ${new Date(firstRound.endDate) < currentDate ? 'YES' : 'NO'}`);

        if (new Date(firstRound.endDate) < currentDate) {
          const totalParticipants = await prisma.competitionParticipant.count({
            where: {
              competitionId: competition.id,
            },
          });

          console.log(`   👥 Total participants: ${totalParticipants}`);
          console.log(`   🎯 Condition check: first_round_ended=${new Date(firstRound.endDate) < currentDate} && participants=${totalParticipants} < 1`);

          if (totalParticipants < 1) {
            console.log(`   ✅ CONDITION MET! Terminating competition...`);
            
            const completionReason = "No one joined this competition, that's why it ended.";
            
            await prisma.competition.update({
              where: { id: competition.id },
              data: {
                completionReason,
                isActive: false,
              },
            });

            console.log(`   ✅ Competition terminated successfully`);
            console.log(`   📝 Reason: ${completionReason}`);
            
            processedCompetitions.push({
              competitionId: competition.id,
              competitionTitle: competition.title,
              roundId: firstRound.id,
              roundName: firstRound.name,
              result: completionReason,
              completionReason,
            });
          } else {
            console.log(`   ❌ Condition not met - competition has participants`);
          }
        } else {
          console.log(`   ❌ Condition not met - first round hasn't ended yet`);
        }
      } else {
        console.log(`   ❌ No rounds found for this competition`);
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('📊 PROCESSING SUMMARY');
    console.log('====================');
    console.log(`Total competitions checked: ${activeCompetitions.length}`);
    console.log(`Competitions terminated: ${processedCompetitions.length}`);

    if (processedCompetitions.length > 0) {
      console.log('\n🏁 TERMINATED COMPETITIONS:');
      processedCompetitions.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.competitionTitle}`);
        console.log(`   ID: ${comp.competitionId}`);
        console.log(`   Reason: ${comp.completionReason}`);
        console.log('');
      });
    } else {
      console.log('\n✅ No competitions needed termination');
    }

    console.log('🎯 NEXT STEPS:');
    console.log('1. Refresh the competition page in your browser');
    console.log('2. Check that second round is no longer visible');
    console.log('3. Verify the completion message is displayed');
    console.log('4. Clear browser cache if needed (Ctrl+F5 or Cmd+Shift+R)');

  } catch (error) {
    console.error('❌ Error processing competitions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Also provide a function to check competition status without processing
async function checkCompetitionStatus(competitionId) {
  console.log(`🔍 Checking status of competition: ${competitionId}`);
  
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    if (!competition) {
      console.log('❌ Competition not found');
      return;
    }

    const currentDate = new Date();
    const firstRound = competition.rounds[0];

    console.log(`📊 Competition: ${competition.title}`);
    console.log(`📊 Active: ${competition.isActive}`);
    console.log(`📊 Completion Reason: ${competition.completionReason || 'None'}`);
    console.log(`📊 Participants: ${competition._count.participants}`);
    
    if (firstRound) {
      console.log(`📊 First Round: ${firstRound.name}`);
      console.log(`📊 First Round End: ${new Date(firstRound.endDate).toISOString()}`);
      console.log(`📊 First Round Ended: ${new Date(firstRound.endDate) < currentDate ? 'YES' : 'NO'}`);
      console.log(`📊 Should Terminate: ${new Date(firstRound.endDate) < currentDate && competition._count.participants < 1 ? 'YES' : 'NO'}`);
    }

  } catch (error) {
    console.error('❌ Error checking competition:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const competitionId = process.argv[2];
  
  if (competitionId) {
    // Check specific competition
    await checkCompetitionStatus(competitionId);
  } else {
    // Process all competitions
    await forceProcessCompetitions();
  }
}

main().catch(console.error);
