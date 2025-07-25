// Script to fix round dates for terminated competitions
// Usage: node scripts/fix-round-dates.js [competitionId]

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixRoundDates(competitionId) {
  console.log('🔧 Fixing Round Dates for Terminated Competitions');
  console.log('================================================\n');

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
      console.log(`\n🏆 Processing: ${competition.title} (ID: ${competition.id})`);
      
      if (!competition.completionReason) {
        console.log('   ⏭️  Skipping - competition not terminated');
        continue;
      }

      console.log(`   Completion Reason: ${competition.completionReason}`);
      console.log(`   Rounds: ${competition.rounds.length}`);

      let needsFix = false;
      const fixes = [];

      // Check each round
      competition.rounds.forEach((round, index) => {
        const startDate = new Date(round.startDate);
        const hasStarted = startDate <= currentTime;

        console.log(`\n   Round ${index + 1}: ${round.name}`);
        console.log(`     Current Start: ${startDate.toISOString()}`);
        console.log(`     Has Started: ${hasStarted ? '✅ YES' : '❌ NO'}`);

        // For terminated competitions, only Round 1 should have started
        if (index > 0 && hasStarted) {
          console.log(`     🚨 ISSUE: Round ${index + 1} has started but competition is terminated!`);
          needsFix = true;

          // Calculate new future dates
          const baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + index); // Each round 1 day in future
          
          const newStartDate = new Date(baseDate);
          const newEndDate = new Date(baseDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days duration

          fixes.push({
            roundId: round.id,
            roundName: round.name,
            oldStart: startDate,
            oldEnd: new Date(round.endDate),
            newStart: newStartDate,
            newEnd: newEndDate
          });

          console.log(`     🔧 Will fix to:`);
          console.log(`       New Start: ${newStartDate.toISOString()}`);
          console.log(`       New End: ${newEndDate.toISOString()}`);
        } else {
          console.log(`     ✅ Round ${index + 1} dates are correct`);
        }
      });

      // Apply fixes
      if (needsFix && fixes.length > 0) {
        console.log(`\n   🔧 Applying ${fixes.length} fixes...`);

        for (const fix of fixes) {
          await prisma.competitionRound.update({
            where: { id: fix.roundId },
            data: {
              startDate: fix.newStart,
              endDate: fix.newEnd,
            },
          });

          console.log(`     ✅ Fixed ${fix.roundName}: ${fix.newStart.toISOString()} → ${fix.newEnd.toISOString()}`);
        }

        console.log(`   ✅ All fixes applied for ${competition.title}`);
      } else {
        console.log(`   ✅ No fixes needed for ${competition.title}`);
      }
    }

    // Verification
    console.log('\n🔍 Verification after fixes:');
    
    const verificationCompetitions = await prisma.competition.findMany({
      where: competitionId ? { id: competitionId } : { id: { in: competitions.map(c => c.id) } },
      include: {
        rounds: { orderBy: { startDate: 'asc' } }
      }
    });

    verificationCompetitions.forEach(comp => {
      console.log(`\n   ${comp.title}:`);
      comp.rounds.forEach((round, index) => {
        const hasStarted = new Date(round.startDate) <= currentTime;
        const status = index === 0 ? (hasStarted ? 'started' : 'future') : (hasStarted ? '🚨 started' : 'future');
        console.log(`     Round ${index + 1}: ${status}`);
      });
    });

    console.log('\n🎯 Expected Result:');
    console.log('   • Round 1: started (✅ correct)');
    console.log('   • Round 2+: future (✅ correct)');
    console.log('   • Debug info should show: Round 1(started), Round 2(future)');
    console.log('   • Round selector should show: Round 1 (clickable), Round 2 (disabled)');

    console.log('\n🔄 Next Steps:');
    console.log('1. Clear browser cache (Ctrl+Shift+R)');
    console.log('2. Refresh competition page');
    console.log('3. Check debug info shows correct round states');
    console.log('4. Verify Round 2 is disabled');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const competitionId = process.argv[2];
  
  if (competitionId && competitionId !== 'all') {
    console.log(`🎯 Fixing specific competition: ${competitionId}`);
  } else {
    console.log('🎯 Fixing all terminated competitions');
  }
  
  await fixRoundDates(competitionId === 'all' ? null : competitionId);
}

main().catch(console.error);
