// Script to force clear all caches and verify competition termination
// Usage: node scripts/force-cache-clear.js [competitionId]

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function forceCacheClear(competitionId) {
  console.log('🧹 Force Cache Clear and Verification');
  console.log('====================================\n');

  try {
    // Step 1: Force process all competitions
    console.log('🔄 Step 1: Force processing all competitions...');
    
    const currentTime = new Date();
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        completionReason: null,
        ...(competitionId ? { id: competitionId } : {})
      },
      include: {
        rounds: {
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: { participants: true }
        }
      }
    });

    console.log(`Found ${activeCompetitions.length} active competitions to check`);

    for (const competition of activeCompetitions) {
      console.log(`\n🏆 Processing: ${competition.title} (ID: ${competition.id})`);
      
      let terminated = false;
      
      // CONDITION 1: No participants joined
      const firstRound = competition.rounds[0];
      if (firstRound && new Date(firstRound.endDate) < currentTime) {
        const participantCount = competition._count.participants;
        
        if (participantCount < 1) {
          console.log(`   ✅ CONDITION 1: No participants (${participantCount}) - terminating`);
          
          await prisma.competition.update({
            where: { id: competition.id },
            data: {
              completionReason: "No one joined this competition, that's why it ended.",
              isActive: false,
            },
          });
          
          await prisma.competitionRoundEntry.updateMany({
            where: {
              round: { competitionId: competition.id },
              postId: { not: null },
            },
            data: { visibleInNormalFeed: true },
          });
          
          terminated = true;
        }
      }
      
      // CONDITION 2: No participants got required likes
      if (!terminated) {
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
              console.log(`   ✅ CONDITION 2: No qualifying participants in ${round.name} (${likesToPass} likes required) - terminating`);
              
              const completionReason = `${round.name} required ${likesToPass} likes but no participant achieved this target, so the competition has been ended.`;
              
              await prisma.competition.update({
                where: { id: competition.id },
                data: {
                  completionReason,
                  isActive: false,
                },
              });
              
              await prisma.competitionRoundEntry.updateMany({
                where: {
                  round: { competitionId: competition.id },
                  postId: { not: null },
                },
                data: { visibleInNormalFeed: true },
              });
              
              terminated = true;
              break;
            }
          }
        }
      }
      
      if (!terminated) {
        console.log(`   ❌ No termination conditions met`);
      }
    }

    // Step 2: Verify specific competition if provided
    if (competitionId) {
      console.log(`\n🔍 Step 2: Verifying competition ${competitionId}...`);
      
      const competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          rounds: { orderBy: { startDate: 'asc' } },
          _count: { select: { participants: true } }
        }
      });

      if (competition) {
        console.log(`📊 Competition: ${competition.title}`);
        console.log(`📊 Active: ${competition.isActive}`);
        console.log(`📊 Completion Reason: ${competition.completionReason || 'None'}`);
        console.log(`📊 Participants: ${competition._count.participants}`);
        
        competition.rounds.forEach((round, index) => {
          const hasStarted = new Date(round.startDate) <= currentTime;
          const hasEnded = new Date(round.endDate) < currentTime;
          console.log(`📊 ${round.name}: ${hasStarted ? (hasEnded ? 'Ended' : 'Active') : 'Upcoming'} (Likes to pass: ${round.likesToPass || 0})`);
        });

        // Check normal feed visibility
        const normalFeedEntries = await prisma.competitionRoundEntry.findMany({
          where: {
            round: { competitionId: competition.id },
            postId: { not: null },
            visibleInNormalFeed: true,
          }
        });

        console.log(`📊 Posts visible in normal feed: ${normalFeedEntries.length}`);

        // Generate cache-busting URLs
        console.log('\n🌐 Step 3: Cache-busting URLs...');
        const timestamp = Date.now();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        console.log('🔗 Open these URLs with fresh cache:');
        console.log(`   Competition Page: ${baseUrl}/competitions/${competition.id}?t=${timestamp}`);
        console.log(`   Competition Feed: ${baseUrl}/competitions/${competition.id}?tab=feed&t=${timestamp}`);
        
        if (competition.rounds.length > 0) {
          console.log(`   Round 1 Feed: ${baseUrl}/competitions/${competition.id}?tab=feed&round=${competition.rounds[0].id}&t=${timestamp}`);
        }
        
        if (competition.rounds.length > 1) {
          console.log(`   Round 2 Feed: ${baseUrl}/competitions/${competition.id}?tab=feed&round=${competition.rounds[1].id}&t=${timestamp}`);
        }

        // Expected behavior
        console.log('\n🎯 Expected Behavior:');
        if (!competition.isActive && competition.completionReason) {
          console.log('   ✅ Competition should show as terminated');
          console.log('   ✅ "All" tab: Shows only posts from rounds that started');
          console.log('   ✅ Round tabs: Past rounds clickable (🔒), future rounds disabled (❌)');
          console.log('   ✅ Regular feed: Shows ALL posts from ALL rounds');
          console.log('   ✅ Upload section: Disabled for all rounds');
        } else {
          console.log('   ❌ Competition is still active');
        }

        // Browser cache clearing instructions
        console.log('\n🔄 Manual Cache Clearing:');
        console.log('   • Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
        console.log('   • Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
        console.log('   • Safari: Cmd+Option+R (Mac)');
        console.log('   • Or open Developer Tools → Network tab → check "Disable cache"');

      } else {
        console.log('❌ Competition not found');
      }
    }

    // Step 3: Test API endpoints directly
    console.log('\n🔌 Step 4: Testing API endpoints...');
    
    if (competitionId) {
      try {
        const fetch = require('node-fetch');
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        // Test competition feed API
        const feedUrl = `${baseUrl}/api/posts/competition-feed?competitionId=${competitionId}&t=${Date.now()}`;
        console.log(`📡 Testing: ${feedUrl}`);
        
        const response = await fetch(feedUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Competition Feed API: ${data.posts?.length || 0} posts returned`);
        } else {
          console.log(`❌ Competition Feed API Error: ${response.status}`);
        }
        
        // Test regular feed API
        const regularFeedUrl = `${baseUrl}/api/posts?t=${Date.now()}`;
        console.log(`📡 Testing: ${regularFeedUrl}`);
        
        const regularResponse = await fetch(regularFeedUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (regularResponse.ok) {
          const regularData = await regularResponse.json();
          console.log(`✅ Regular Feed API: ${regularData.posts?.length || 0} posts returned`);
        } else {
          console.log(`❌ Regular Feed API Error: ${regularResponse.status}`);
        }
        
      } catch (apiError) {
        console.log(`⚠️  Could not test APIs (server might not be running): ${apiError.message}`);
      }
    }

    console.log('\n✅ Cache clearing and verification complete!');

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
    console.log(`🎯 Processing specific competition: ${competitionId}`);
  } else {
    console.log('🎯 Processing all active competitions');
  }
  
  await forceCacheClear(competitionId);
}

main().catch(console.error);
