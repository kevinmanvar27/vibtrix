// Quick verification script for round selector fix
// Usage: node scripts/verify-round-selector-fix.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verifyRoundSelectorFix() {
  console.log('🔍 Verifying Round Selector Fix');
  console.log('==============================\n');

  try {
    // Step 1: Create or find a terminated competition
    console.log('📋 Step 1: Setting up test scenario...');
    
    let testCompetition = await prisma.competition.findFirst({
      where: {
        isActive: false,
        completionReason: { not: null }
      },
      include: {
        rounds: { orderBy: { startDate: 'asc' } }
      }
    });

    if (!testCompetition) {
      console.log('   No terminated competition found, creating one...');
      
      // Create test dates
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const today = new Date();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      testCompetition = await prisma.competition.create({
        data: {
          title: "Round Selector Test Competition",
          description: "Testing round selector behavior",
          mediaType: "BOTH",
          isActive: false, // Already terminated
          completionReason: "Round 1 required 5 likes but no participant achieved this target, so the competition has been ended.",
          rounds: {
            create: [
              {
                name: "Round 1",
                startDate: yesterday,
                endDate: today,
                likesToPass: 5,
              },
              {
                name: "Round 2",
                startDate: tomorrow,
                endDate: nextWeek,
                likesToPass: 10,
              }
            ]
          }
        },
        include: {
          rounds: { orderBy: { startDate: 'asc' } }
        }
      });
      
      console.log('   ✅ Created test competition');
    } else {
      console.log('   ✅ Found existing terminated competition');
    }

    console.log(`   Competition: ${testCompetition.title}`);
    console.log(`   ID: ${testCompetition.id}`);
    console.log(`   Active: ${testCompetition.isActive}`);
    console.log(`   Completion Reason: ${testCompetition.completionReason}`);
    console.log(`   Rounds: ${testCompetition.rounds.length}`);

    // Step 2: Analyze round states
    console.log('\n📋 Step 2: Analyzing round states...');
    
    const currentDate = new Date();
    
    testCompetition.rounds.forEach((round, index) => {
      const hasStarted = new Date(round.startDate) <= currentDate;
      const hasEnded = new Date(round.endDate) < currentDate;
      
      console.log(`\n   Round ${index + 1}: ${round.name}`);
      console.log(`     Start: ${round.startDate.toISOString()}`);
      console.log(`     End: ${round.endDate.toISOString()}`);
      console.log(`     Has Started: ${hasStarted}`);
      console.log(`     Has Ended: ${hasEnded}`);
      console.log(`     Expected State: ${hasStarted ? 'Clickable with 🔒' : 'Disabled with ❌'}`);
    });

    // Step 3: Check what should be visible
    console.log('\n📋 Step 3: Expected behavior verification...');
    
    const round1 = testCompetition.rounds[0];
    const round2 = testCompetition.rounds[1];
    
    const round1Started = new Date(round1.startDate) <= currentDate;
    const round2Started = new Date(round2.startDate) <= currentDate;
    
    console.log('\n   🎯 Expected Round Selector Behavior:');
    console.log(`   • Round 1 (${round1.name}): ${round1Started ? '✅ Visible, Clickable, 🔒 icon' : '❌ Should be visible and clickable'}`);
    console.log(`   • Round 2 (${round2.name}): ${round2Started ? '❌ Should be disabled' : '✅ Visible, Disabled, ❌ icon'}`);
    console.log('   • "All" button: ✅ Should be visible and show only Round 1 posts');
    
    console.log('\n   🎯 Expected Feed Behavior:');
    console.log('   • "All" tab: Shows only Round 1 posts (rounds that started)');
    console.log('   • Round 1 tab: Clickable, shows Round 1 posts');
    console.log('   • Round 2 tab: Visible but disabled/non-clickable');

    // Step 4: Provide test URLs
    console.log('\n📋 Step 4: Test URLs...');
    
    const baseUrl = 'http://localhost:3000';
    const timestamp = Date.now();
    
    console.log('\n🔗 Open these URLs to verify:');
    console.log(`   Competition Page: ${baseUrl}/competitions/${testCompetition.id}?t=${timestamp}`);
    console.log(`   Competition Feed: ${baseUrl}/competitions/${testCompetition.id}?tab=feed&t=${timestamp}`);
    console.log(`   Round 1 Direct: ${baseUrl}/competitions/${testCompetition.id}?tab=feed&round=${round1.id}&t=${timestamp}`);
    console.log(`   Round 2 Direct: ${baseUrl}/competitions/${testCompetition.id}?tab=feed&round=${round2.id}&t=${timestamp}`);

    // Step 5: Verification checklist
    console.log('\n📋 Step 5: Manual verification checklist...');
    
    console.log('\n✅ What to check in browser:');
    console.log('   1. Open Competition Feed URL');
    console.log('   2. Look for debug info box (gray box with competition details)');
    console.log('   3. Check browser console for RoundSelector debug logs');
    console.log('   4. Verify round selector shows:');
    console.log('      - "All" button (clickable)');
    console.log('      - "Round 1" button with 🔒 icon (clickable)');
    console.log('      - "Round 2" button with ❌ icon (disabled)');
    console.log('   5. Click "All" - should show only Round 1 posts');
    console.log('   6. Click "Round 1" - should work and show Round 1 posts');
    console.log('   7. Try clicking "Round 2" - should NOT work (disabled)');
    console.log('   8. Check tooltips on hover');

    console.log('\n🐛 If round selector is not working:');
    console.log('   1. Check browser console for debug logs');
    console.log('   2. Verify debug info shows: isActive=false, completionReason=set');
    console.log('   3. Check if both rounds are being passed to RoundSelector');
    console.log('   4. Verify isCompetitionTerminated=true in debug logs');
    console.log('   5. Clear browser cache (Ctrl+Shift+R)');

    console.log('\n🧹 Cleanup:');
    console.log(`   Test competition ID: ${testCompetition.id}`);
    console.log('   You can delete it manually if needed');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRoundSelectorFix().catch(console.error);
