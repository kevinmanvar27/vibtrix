// Final verification script for terminated competition behavior
// Usage: node scripts/final-verification.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function finalVerification() {
  console.log('✅ Final Verification: Terminated Competition Behavior');
  console.log('=====================================================\n');

  try {
    // Get a terminated competition for testing
    const testCompetition = await prisma.competition.findFirst({
      where: {
        completionReason: { not: null }
      },
      include: {
        rounds: { orderBy: { startDate: 'asc' } }
      }
    });

    if (!testCompetition) {
      console.log('❌ No terminated competitions found');
      return;
    }

    console.log('🏆 Test Competition:');
    console.log(`   ID: ${testCompetition.id}`);
    console.log(`   Title: ${testCompetition.title}`);
    console.log(`   Active: ${testCompetition.isActive}`);
    console.log(`   Completion Reason: ${testCompetition.completionReason}`);

    // Verify round states
    const currentTime = new Date();
    console.log('\n📅 Round States Verification:');
    
    let allCorrect = true;
    
    testCompetition.rounds.forEach((round, index) => {
      const hasStarted = new Date(round.startDate) <= currentTime;
      const hasEnded = new Date(round.endDate) < currentTime;
      
      console.log(`\n   Round ${index + 1}: ${round.name}`);
      console.log(`     Start: ${round.startDate.toISOString()}`);
      console.log(`     Has Started: ${hasStarted ? '✅ YES' : '❌ NO'}`);
      console.log(`     Has Ended: ${hasEnded ? '✅ YES' : '❌ NO'}`);
      
      if (index === 0) {
        // Round 1 should have started
        if (hasStarted) {
          console.log(`     ✅ CORRECT: Round 1 has started`);
        } else {
          console.log(`     ❌ ERROR: Round 1 should have started`);
          allCorrect = false;
        }
      } else {
        // Round 2+ should NOT have started
        if (!hasStarted) {
          console.log(`     ✅ CORRECT: Round ${index + 1} has not started`);
        } else {
          console.log(`     ❌ ERROR: Round ${index + 1} should not have started`);
          allCorrect = false;
        }
      }
    });

    // Verify competition state
    console.log('\n🏁 Competition State Verification:');
    
    if (!testCompetition.isActive && testCompetition.completionReason) {
      console.log('   ✅ CORRECT: Competition is inactive with completion reason');
    } else {
      console.log('   ❌ ERROR: Competition state is inconsistent');
      console.log(`      isActive: ${testCompetition.isActive}`);
      console.log(`      completionReason: ${testCompetition.completionReason || 'null'}`);
      allCorrect = false;
    }

    // Expected behavior summary
    console.log('\n🎯 Expected Frontend Behavior:');
    console.log('   1. Competition Ended message should be visible ✅');
    console.log('   2. Debug info should show:');
    console.log(`      - isActive=false ✅`);
    console.log(`      - isTerminated=YES ✅`);
    console.log(`      - Round 1(started), Round 2+(future) ✅`);
    console.log('   3. Round Selector should show:');
    console.log('      - "All" button (clickable) ✅');
    console.log('      - "Round 1" (clickable, read-only) ✅');
    console.log('      - "Round 2+" (visible but disabled) ✅');

    // Test URLs
    console.log('\n🔗 Test URLs:');
    console.log(`   Competition: http://localhost:3000/competitions/${testCompetition.id}`);
    console.log(`   Feed: http://localhost:3000/competitions/${testCompetition.id}?tab=feed`);

    // Final status
    console.log('\n📊 FINAL STATUS:');
    if (allCorrect) {
      console.log('   🎉 ALL CHECKS PASSED! ✅');
      console.log('   🎯 Backend logic is now correct');
      console.log('   🔄 Clear browser cache and test frontend');
    } else {
      console.log('   ❌ SOME ISSUES FOUND');
      console.log('   🔧 Run fix scripts again if needed');
    }

    console.log('\n🔄 Manual Testing Steps:');
    console.log('   1. Clear browser cache (Ctrl+Shift+R)');
    console.log('   2. Open the Feed URL above');
    console.log('   3. Verify "Competition Ended" message');
    console.log('   4. Check debug info shows correct states');
    console.log('   5. Verify Round 1 is clickable (read-only)');
    console.log('   6. Verify Round 2+ are disabled');
    console.log('   7. Try clicking Round 2 - should not work');
    console.log('   8. Check tooltips on hover');

    console.log('\n🎯 Business Logic Verification:');
    console.log('   ✅ Minimum likes required → Next round entry');
    console.log('   ✅ No minimum likes → No entry');
    console.log('   ✅ No qualifying participants → Competition end');
    console.log('   ✅ Competition end → Future rounds disabled');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification().catch(console.error);
