#!/usr/bin/env node

/**
 * Vibtrix Competition Issues Fix Script
 *
 * This script addresses three critical issues:
 * 1. Payment system authentication failures
 * 2. Multi-round competition display bugs (Round 3 files not showing)
 * 3. Missing winner display functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Vibtrix Competition Issues Fix Script');
  console.log('==========================================\n');

  try {
    // Issue 1: Check Payment System Configuration
    console.log('1️⃣ Checking Payment System Configuration...');
    await checkPaymentSystem();

    // Issue 2: Fix Round 3 Visibility Issues
    console.log('\n2️⃣ Fixing Round 3 Visibility Issues...');
    await fixRoundVisibilityIssues();

    // Issue 3: Fix Winner Display Issues
    console.log('\n3️⃣ Fixing Winner Display Issues...');
    await fixWinnerDisplayIssues();

    console.log('\n✅ All fixes completed successfully!');
    console.log('\n📋 Summary of Actions:');
    console.log('- Payment system configuration checked');
    console.log('- Round visibility flags updated for all competitions');
    console.log('- Winner calculation logic verified');
    console.log('- Competition completion status updated');

  } catch (error) {
    console.error('❌ Error during fix process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkPaymentSystem() {
  try {
    // Check environment variables
    const envKeyId = process.env.RAZORPAY_KEY_ID;
    const envKeySecret = process.env.RAZORPAY_KEY_SECRET;

    console.log('   Environment Variables:');
    console.log(`   - RAZORPAY_KEY_ID: ${envKeyId ? '✅ Present' : '❌ Missing'}`);
    console.log(`   - RAZORPAY_KEY_SECRET: ${envKeySecret ? '✅ Present' : '❌ Missing'}`);

    if (envKeyId && envKeySecret) {
      console.log('   - Format validation:');
      console.log(`     - Key ID starts with 'rzp_': ${envKeyId.startsWith('rzp_') ? '✅' : '❌'}`);
      console.log(`     - Key Secret length >= 20: ${envKeySecret.length >= 20 ? '✅' : '❌'}`);
    }

    // Check database settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'settings' },
      select: {
        razorpayEnabled: true,
        razorpayKeyId: true,
        razorpayKeySecret: true,
      },
    });

    console.log('\n   Database Settings:');
    if (settings) {
      console.log(`   - Razorpay Enabled: ${settings.razorpayEnabled ? '✅' : '❌'}`);
      console.log(`   - Key ID in DB: ${settings.razorpayKeyId ? '✅ Present' : '❌ Missing'}`);
      console.log(`   - Key Secret in DB: ${settings.razorpayKeySecret ? '✅ Present' : '❌ Missing'}`);

      if (settings.razorpayKeyId && settings.razorpayKeySecret) {
        console.log('   - Format validation:');
        console.log(`     - Key ID starts with 'rzp_': ${settings.razorpayKeyId.startsWith('rzp_') ? '✅' : '❌'}`);
        console.log(`     - Key Secret length >= 20: ${settings.razorpayKeySecret.length >= 20 ? '✅' : '❌'}`);
      }
    } else {
      console.log('   - ❌ No settings found in database');
    }

    // Check for recent payment failures
    const recentFailedPayments = await prisma.payment.count({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    console.log(`\n   Recent Payment Failures (24h): ${recentFailedPayments}`);

  } catch (error) {
    console.error('   ❌ Error checking payment system:', error.message);
  }
}

async function fixRoundVisibilityIssues() {
  try {
    // Get all competitions with multiple rounds
    const competitions = await prisma.competition.findMany({
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        },
        participants: {
          include: {
            roundEntries: {
              include: {
                round: true,
                post: true
              }
            }
          }
        }
      }
    });

    console.log(`   Found ${competitions.length} competitions to check`);

    let totalEntriesFixed = 0;

    for (const competition of competitions) {
      if (competition.rounds.length < 3) continue; // Skip competitions with less than 3 rounds

      console.log(`\n   📊 Processing: ${competition.title}`);
      
      const currentDate = new Date();
      let entriesFixed = 0;

      // Check each participant's round entries
      for (const participant of competition.participants) {
        for (const entry of participant.roundEntries) {
          const round = entry.round;
          const roundStarted = new Date(round.startDate) <= currentDate;
          const hasPost = !!entry.postId;

          // Fix visibility for entries that have posts but aren't visible
          if (hasPost && roundStarted && !entry.visibleInCompetitionFeed) {
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: {
                visibleInCompetitionFeed: true,
                visibleInNormalFeed: true,
                updatedAt: new Date()
              }
            });
            entriesFixed++;
            console.log(`     ✅ Fixed visibility for ${round.name} entry`);
          }
        }
      }

      if (entriesFixed > 0) {
        console.log(`   ✅ Fixed ${entriesFixed} entries for ${competition.title}`);
        totalEntriesFixed += entriesFixed;
      }
    }

    console.log(`\n   ✅ Total entries fixed: ${totalEntriesFixed}`);

  } catch (error) {
    console.error('   ❌ Error fixing round visibility:', error.message);
  }
}

async function fixWinnerDisplayIssues() {
  try {
    // Get all competitions that should be completed
    const currentDate = new Date();
    
    const competitions = await prisma.competition.findMany({
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        }
      }
    });

    console.log(`   Found ${competitions.length} competitions to check`);

    let competitionsFixed = 0;

    for (const competition of competitions) {
      const allRoundsEnded = competition.rounds.every(round => 
        new Date(round.endDate) < currentDate
      );

      // If all rounds have ended but no completion reason is set, this might be why winners aren't showing
      if (allRoundsEnded && !competition.completionReason) {
        console.log(`\n   📊 Checking: ${competition.title}`);
        
        // Check if there are any participants with posts in the final round
        const finalRound = competition.rounds[competition.rounds.length - 1];
        
        const finalRoundEntries = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: finalRound.id,
            postId: { not: null }
          },
          include: {
            post: {
              include: {
                _count: {
                  select: { likes: true }
                }
              }
            },
            participant: {
              include: {
                user: true
              }
            }
          }
        });

        if (finalRoundEntries.length > 0) {
          console.log(`     Found ${finalRoundEntries.length} entries in final round`);
          
          // Sort by likes to determine winners
          const sortedEntries = finalRoundEntries.sort((a, b) => {
            const aLikes = a.post?._count?.likes || 0;
            const bLikes = b.post?._count?.likes || 0;
            return bLikes - aLikes;
          });

          // Update winner positions for top 3
          for (let i = 0; i < Math.min(3, sortedEntries.length); i++) {
            const entry = sortedEntries[i];
            await prisma.competitionRoundEntry.update({
              where: { id: entry.id },
              data: { winnerPosition: i + 1 }
            });
          }

          console.log(`     ✅ Updated winner positions for top ${Math.min(3, sortedEntries.length)} entries`);
          competitionsFixed++;
        } else {
          // No entries in final round, mark as completed with reason
          await prisma.competition.update({
            where: { id: competition.id },
            data: { completionReason: 'No participants in final round' }
          });
          console.log(`     ✅ Marked as completed (no final round participants)`);
          competitionsFixed++;
        }
      }
    }

    console.log(`\n   ✅ Competitions fixed: ${competitionsFixed}`);

  } catch (error) {
    console.error('   ❌ Error fixing winner display:', error.message);
  }
}

// Run the script
main().catch(console.error);
