const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkActiveCompetitions() {
  try {
    console.log("Checking for active competitions...");
    const currentDate = new Date();

    // Find all active competitions
    const activeCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
      },
      include: {
        rounds: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    console.log(`Found ${activeCompetitions.length} active competitions`);

    for (const comp of activeCompetitions) {
      console.log(`\nCompetition: ${comp.title} (ID: ${comp.id})`);
      console.log(`Slug: ${comp.slug}`);

      // Check all rounds
      console.log(`This competition has ${comp.rounds.length} rounds:`);

      for (const round of comp.rounds) {
        const isActive =
          new Date(round.startDate) <= currentDate &&
          new Date(round.endDate) >= currentDate;
        const hasStarted = new Date(round.startDate) <= currentDate;
        const hasEnded = new Date(round.endDate) < currentDate;

        console.log(`\nRound: ${round.name} (ID: ${round.id})`);
        console.log(
          `Period: ${new Date(round.startDate).toLocaleString()} to ${new Date(round.endDate).toLocaleString()}`,
        );
        console.log(
          `Status: ${isActive ? "ACTIVE" : hasEnded ? "ENDED" : hasStarted ? "STARTED" : "NOT STARTED"}`,
        );

        // Check for entries in this round
        const entries = await prisma.competitionRoundEntry.findMany({
          where: {
            roundId: round.id,
          },
          include: {
            post: {
              select: {
                id: true,
                content: true,
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            participant: {
              select: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        });

        console.log(`Found ${entries.length} entries for this round`);
        console.log(
          `Entries with posts: ${entries.filter((e) => e.postId).length}`,
        );
        console.log(
          `Entries without posts: ${entries.filter((e) => !e.postId).length}`,
        );

        // Check entries with posts
        const entriesWithPosts = entries.filter((e) => e.postId);
        if (entriesWithPosts.length > 0) {
          console.log("Entries with posts:");
          for (const entry of entriesWithPosts) {
            console.log(`- Entry ID: ${entry.id}, Post ID: ${entry.postId}`);
            console.log(`  User: ${entry.participant.user.username}`);
            console.log(
              `  visibleInCompetitionFeed: ${entry.visibleInCompetitionFeed}, visibleInNormalFeed: ${entry.visibleInNormalFeed}`,
            );
          }
        } else {
          console.log("No entries with posts found for this round");
        }

        // Check the competition feed query
        console.log("Testing competition feed query...");
        const feedPosts = await prisma.post.findMany({
          where: {
            competitionEntries: {
              some: {
                roundId: round.id,
                visibleInCompetitionFeed: true,
              },
            },
          },
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        });

        console.log(
          `Competition feed query returned ${feedPosts.length} posts`,
        );
        if (feedPosts.length > 0) {
          console.log("Posts in feed:");
          for (const post of feedPosts) {
            console.log(`- Post ID: ${post.id}, User: ${post.user.username}`);
          }
        } else {
          console.log("No posts found in competition feed query");
        }
      }
    }

    // If no active competitions were found, check for any competitions
    if (activeCompetitions.length === 0) {
      const allCompetitions = await prisma.competition.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          isActive: true,
        },
      });

      console.log(
        `\nFound ${allCompetitions.length} competitions (active or inactive):`,
      );
      for (const comp of allCompetitions) {
        console.log(
          `- ${comp.title} (ID: ${comp.id}, Active: ${comp.isActive})`,
        );
      }
    }
  } catch (error) {
    console.error("Error checking competitions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActiveCompetitions();
