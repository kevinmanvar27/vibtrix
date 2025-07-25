const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPostInFeed() {
  console.log('Checking if post appears in regular feed query...');
  
  const postId = 'cm9l8up8x000ltu1gh5yfv61d';

  try {
    // 1. Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            isProfilePublic: true
          }
        },
        competitionEntries: {
          include: {
            round: {
              include: {
                competition: {
                  select: {
                    title: true,
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!post) {
      console.log(`Post with ID ${postId} not found.`);
      return;
    }

    console.log(`Found post by ${post.user.displayName} (@${post.user.username})`);
    console.log(`User profile is ${post.user.isProfilePublic ? 'public' : 'private'}`);
    
    // 2. Check if the post would appear in the regular feed query
    // This replicates the query in the for-you API route
    const postInFeed = await prisma.post.findFirst({
      where: {
        id: postId,
        OR: [
          // Regular posts (not part of a competition)
          {
            competitionEntries: {
              none: {}
            }
          },
          // Competition posts that should be visible in normal feed
          {
            competitionEntries: {
              some: {
                visibleInNormalFeed: true
              }
            }
          }
        ],
        // Only include posts from public profiles
        user: {
          OR: [
            // Public profiles
            { isProfilePublic: true }
            // We're not checking for followers here since we're testing as a guest
          ]
        }
      }
    });

    if (postInFeed) {
      console.log('The post WOULD appear in the regular feed query.');
    } else {
      console.log('The post would NOT appear in the regular feed query.');
      
      // Check why it's not appearing
      if (!post.user.isProfilePublic) {
        console.log('Reason: The user profile is private.');
      }
      
      const visibleInNormalFeed = post.competitionEntries.some(entry => entry.visibleInNormalFeed);
      if (!visibleInNormalFeed) {
        console.log('Reason: No competition entries are marked as visible in normal feed.');
      }
      
      // Check if there are any other issues
      console.log('Checking for other potential issues...');
      
      // Check if the post is associated with a competition
      if (post.competitionEntries.length === 0) {
        console.log('The post is not associated with any competition.');
      } else {
        console.log(`The post is associated with ${post.competitionEntries.length} competition entries.`);
        
        // Log details about each competition entry
        post.competitionEntries.forEach((entry, index) => {
          console.log(`Entry ${index + 1}:`);
          console.log(`  ID: ${entry.id}`);
          console.log(`  Competition: ${entry.round.competition.title}`);
          console.log(`  Round: ${entry.round.name}`);
          console.log(`  Visible in normal feed: ${entry.visibleInNormalFeed}`);
          console.log(`  Visible in competition feed: ${entry.visibleInCompetitionFeed}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking post in feed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostInFeed()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script failed:', error));
