// Script to check round dates and fix them if needed
// Usage: node scripts/check-round-dates.js [competitionId]

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoundDates(competitionId) {
  console.log('📅 Checking Round Dates');
  console.log('======================\n');

  try {
    const whereClause = competitionId 
      ? { id: competitionId }
      : {
          completionReason: { not: null }
        };

    const competitions = await prisma.competition.findMany({
      where: whereClause,
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    if (competitions.length === 0) {
      console.log('❌ No competitions found');
      return;
    }

    const currentTime = new Date();
    console.log(`🕐 Current time: ${currentTime.toISOString()}`);

    for (const competition of competitions) {
      console.log(`\n🏆 Competition: ${competition.title} (ID: ${competition.id})`);
      console.log(`   Active: ${competition.isActive}`);
      console.log(`   Completion Reason: ${competition.completionReason || 'None'}`);
      console.log(`   Rounds: ${competition.rounds.length}`);

      let hasDateIssues = false;

      competition.rounds.forEach((round, index) => {
        const startDate = new Date(round.startDate);
        const endDate = new Date(round.endDate);
        const hasStarted = startDate <= currentTime;
        const hasEnded = endDate < currentTime;

        console.log(`\n   Round ${index + 1}: ${round.name} (ID: ${round.id})`);
        console.log(`     Start: ${startDate.toISOString()}`);
        console.log(`     End: ${endDate.toISOString()}`);
        console.log(`     Has Started: ${hasStarted ? '✅ YES' : '❌ NO'}`);
        console.log(`     Has Ended: ${hasEnded ? '✅ YES' : '❌ NO'}`);
        console.log(`     Likes to Pass: ${round.likesToPass || 0}`);

        // Check for issues
        if (competition.completionReason && index > 0 && hasStarted) {
          console.log(`     🚨 ISSUE: Round ${index + 1} has started but competition is terminated!`);
          hasDateIssues = true;
        }

        if (startDate >= endDate) {
          console.log(`     🚨 ISSUE: Start date is after end date!`);
          hasDateIssues = true;
        }

        if (index > 0) {
          const prevRound = competition.rounds[index - 1];
          const prevEndDate = new Date(prevRound.endDate);
          if (startDate <= prevEndDate) {
            console.log(`     🚨 ISSUE: Round ${index + 1} starts before Round ${index} ends!`);
            hasDateIssues = true;
          }
        }
      });

      // Suggest fixes
      if (hasDateIssues) {
        console.log(`\n   🔧 SUGGESTED FIXES for ${competition.title}:`);
        
        if (competition.completionReason) {
          console.log('   1. Competition is terminated, so future rounds should not have started');
          console.log('   2. Fix Round 2+ dates to be in the future');
          
          // Calculate proper dates
          const round1 = competition.rounds[0];
          const round1End = new Date(round1.endDate);
          
          for (let i = 1; i < competition.rounds.length; i++) {
            const round = competition.rounds[i];
            const shouldStartDate = new Date(round1End.getTime() + (i * 24 * 60 * 60 * 1000)); // 1 day after previous round
            const shouldEndDate = new Date(shouldStartDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days duration
            
            console.log(`   Round ${i + 1} should be:`);
            console.log(`     Start: ${shouldStartDate.toISOString()}`);
            console.log(`     End: ${shouldEndDate.toISOString()}`);
          }
        }
      } else {
        console.log(`\n   ✅ No date issues found for ${competition.title}`);
      }
    }

    // Offer to fix dates
    console.log('\n🔧 AUTOMATIC FIX AVAILABLE');
    console.log('==========================');
    console.log('Run this command to fix round dates:');
    console.log(`node scripts/fix-round-dates.js ${competitionId || 'all'}`);

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
    console.log(`🎯 Checking specific competition: ${competitionId}`);
  } else {
    console.log('🎯 Checking all terminated competitions');
  }
  
  await checkRoundDates(competitionId);
}

main().catch(console.error);
