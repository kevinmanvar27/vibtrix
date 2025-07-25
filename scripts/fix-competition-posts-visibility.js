const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompetitionPostsVisibility() {
  console.log('Starting comprehensive fix for competition posts visibility...');

  try {
    // 1. Check database schema to ensure the visibleInNormalFeed field exists
    console.log('Checking database schema...');
    try {
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'competition_round_entries'
          AND column_name = 'visibleInNormalFeed'
        );
      `;

      if (!columnExists[0].exists) {
        console.error('Column "visibleInNormalFeed" does not exist in the competition_round_entries table!');
        console.error('Please run a migration to add this column before continuing.');
        return;
      } else {
        console.log('Column "visibleInNormalFeed" exists in the schema.');
      }
    } catch (schemaError) {
      console.error('Error checking schema:', schemaError);
      return;
    }

    // 2. Get all competition entries with posts
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        postId: { not: null },
      },
      include: {
        post: {
          select: { 
            id: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                username: true
              }
            }
          }
        },
        round: {
          select: { 
            id: true,
            name: true,
            competitionId: true,
            competition: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${entries.length} competition entries with posts to update`);

    // 3. Count entries that need updating
    const entriesToUpdate = entries.filter(entry => entry.visibleInNormalFeed === false);
    console.log(`Of these, ${entriesToUpdate.length} entries need to be updated (visibleInNormalFeed = false)`);

    if (entriesToUpdate.length === 0) {
      console.log('No entries need updating. All competition posts are already visible in the normal feed.');
      return;
    }

    // 4. Update all entries to be visible in the normal feed
    console.log('Updating entries...');
    const results = await Promise.all(entriesToUpdate.map(async (entry) => {
      try {
        const updatedEntry = await prisma.competitionRoundEntry.update({
          where: { id: entry.id },
          data: {
            visibleInNormalFeed: true,
          },
        });

        return {
          entryId: entry.id,
          roundId: entry.roundId,
          postId: entry.postId,
          competitionTitle: entry.round.competition.title,
          roundName: entry.round.name,
          username: entry.post.user.username,
          postCreatedAt: entry.post.createdAt,
          status: "updated",
          visibleInNormalFeed: updatedEntry.visibleInNormalFeed,
        };
      } catch (error) {
        console.error(`Error updating entry ${entry.id}:`, error);
        return {
          entryId: entry.id,
          roundId: entry.roundId,
          postId: entry.postId,
          status: "error",
          error: error.message,
        };
      }
    }));

    const successCount = results.filter(r => r.status === "updated").length;
    const errorCount = results.filter(r => r.status === "error").length;

    console.log(`Successfully updated ${successCount} entries`);
    if (errorCount > 0) {
      console.log(`Failed to update ${errorCount} entries`);
      console.log('Entries with errors:');
      results.filter(r => r.status === "error").forEach(entry => {
        console.log(`- Entry ID: ${entry.entryId}, Error: ${entry.error}`);
      });
    }

    // 5. Log details of updated entries
    console.log('\nDetails of updated entries:');
    results.filter(r => r.status === "updated").forEach((entry, index) => {
      console.log(`${index + 1}. Competition: "${entry.competitionTitle}", Round: "${entry.roundName}", User: ${entry.username}, Post created: ${entry.postCreatedAt}`);
    });

    console.log('\nFix completed successfully');
  } catch (error) {
    console.error('Error during fix operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompetitionPostsVisibility()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
