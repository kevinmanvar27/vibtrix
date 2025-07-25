const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPostDetails() {
  console.log('Checking detailed information about the post...');
  
  const postId = 'cm9l8up8x000ltu1gh5yfv61d';

  try {
    // Get the post with all related information
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            isProfilePublic: true,
            isActive: true,
            onlineStatus: true
          }
        },
        attachments: true,
        competitionEntries: {
          include: {
            round: {
              include: {
                competition: {
                  select: {
                    id: true,
                    title: true,
                    isActive: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true
          }
        }
      }
    });

    if (!post) {
      console.log(`Post with ID ${postId} not found.`);
      return;
    }

    console.log('Post Details:');
    console.log(`ID: ${post.id}`);
    console.log(`Content: ${post.content}`);
    console.log(`Created At: ${post.createdAt}`);
    console.log(`Likes: ${post._count.likes}`);
    console.log(`Comments: ${post._count.comments}`);
    console.log(`Views: ${post._count.views}`);
    
    console.log('\nUser Details:');
    console.log(`ID: ${post.user.id}`);
    console.log(`Username: ${post.user.username}`);
    console.log(`Display Name: ${post.user.displayName}`);
    console.log(`Profile Public: ${post.user.isProfilePublic}`);
    console.log(`User Active: ${post.user.isActive}`);
    console.log(`Online Status: ${post.user.onlineStatus}`);
    
    console.log('\nAttachments:');
    if (post.attachments.length === 0) {
      console.log('No attachments found.');
    } else {
      post.attachments.forEach((attachment, index) => {
        console.log(`Attachment ${index + 1}:`);
        console.log(`  ID: ${attachment.id}`);
        console.log(`  Type: ${attachment.type}`);
        console.log(`  URL: ${attachment.url}`);
      });
    }
    
    console.log('\nCompetition Entries:');
    if (post.competitionEntries.length === 0) {
      console.log('No competition entries found.');
    } else {
      post.competitionEntries.forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log(`  ID: ${entry.id}`);
        console.log(`  Visible in Normal Feed: ${entry.visibleInNormalFeed}`);
        console.log(`  Visible in Competition Feed: ${entry.visibleInCompetitionFeed}`);
        console.log(`  Round: ${entry.round.name}`);
        console.log(`  Competition: ${entry.round.competition.title}`);
        console.log(`  Competition Active: ${entry.round.competition.isActive}`);
      });
    }
    
    // Now let's check if this post would appear in the for-you feed query
    console.log('\nChecking if post would appear in for-you feed query...');
    
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
          isProfilePublic: true,
          isActive: true
        }
      }
    });
    
    if (postInFeed) {
      console.log('The post WOULD appear in the for-you feed query.');
    } else {
      console.log('The post would NOT appear in the for-you feed query.');
      
      // Let's check why it's not appearing
      if (!post.user.isProfilePublic) {
        console.log('Reason: The user profile is private.');
      }
      
      if (!post.user.isActive) {
        console.log('Reason: The user account is not active.');
      }
      
      const visibleInNormalFeed = post.competitionEntries.some(entry => entry.visibleInNormalFeed);
      if (!visibleInNormalFeed) {
        console.log('Reason: No competition entries are marked as visible in normal feed.');
      }
    }
    
    // Check if the post appears in the actual database query used by the API
    console.log('\nChecking with the exact query used by the API...');
    
    const postsFromApi = await prisma.post.findMany({
      where: {
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
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    
    const foundInResults = postsFromApi.some(p => p.id === postId);
    
    if (foundInResults) {
      console.log('The post IS found in the API query results.');
      
      // Find its position in the results
      const position = postsFromApi.findIndex(p => p.id === postId) + 1;
      console.log(`It appears at position ${position} out of ${postsFromApi.length} posts.`);
    } else {
      console.log('The post is NOT found in the API query results.');
      console.log('This suggests there might be an issue with the query or the post data.');
    }
    
  } catch (error) {
    console.error('Error checking post details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPostDetails()
  .then(() => console.log('Script completed.'))
  .catch(error => console.error('Script failed:', error));
