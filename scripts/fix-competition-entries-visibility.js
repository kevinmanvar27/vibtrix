const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompetitionEntriesVisibility() {
  console.log('Starting to fix competition entries visibility...');

  try {
    // Get all competition entries with posts
    const entries = await prisma.competitionRoundEntry.findMany({
      where: {
        postId: { not: null },
      },
      include: {
        post: {
          select: { id: true }
        },
        round: {
          select: { 
            id: true,
            name: true,
            competitionId: true
          }
        }
      }
    });

    console.log(`Found ${entries.length} competition entries with posts to update`);

    // Update all entries to be visible in the normal feed
    const results = await Promise.all(entries.map(async (entry) => {
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
    }

    console.log('Fix completed');
  } catch (error) {
    console.error('Error during fix operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompetitionEntriesVisibility()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
