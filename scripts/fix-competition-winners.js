// This script fixes the winner determination logic for a competition
// It ensures that participants who received the required number of likes in the final round are properly recognized as winners
// Usage: node scripts/fix-competition-winners.js <competitionId>

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID from command line arguments
    const competitionId = process.argv[2];

    if (!competitionId) {
      console.error("Error: Competition ID is required");
      console.log(
        "Usage: node scripts/fix-competition-winners.js <competitionId>",
      );
      process.exit(1);
    }

    console.log(
      `Fixing winner determination for competition: ${competitionId}`,
    );

    // Check if the competition exists
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    if (!competition) {
      console.error(`Error: Competition with ID ${competitionId} not found`);
      process.exit(1);
    }

    console.log(
      `Found competition: "${competition.title}" with ${competition.rounds.length} rounds`,
    );

    // Check if the competition is completed
    const currentDate = new Date();
    const allRoundsEnded = competition.rounds.every(
      (round) => new Date(round.endDate) < currentDate,
    );

    if (!allRoundsEnded) {
      console.error("Error: Competition is not completed yet");
      process.exit(1);
    }

    // Get all rounds of the competition in order
    const rounds = competition.rounds;

    // Get the last round of the competition
    const lastRound = rounds[rounds.length - 1];
    console.log(
      `Last round: "${lastRound.name}" with likesToPass: ${lastRound.likesToPass || "Not set"}`,
    );

    // For proper qualification, we need to check if participants qualified through all rounds
    // First, get all participants who weren't disqualified
    const participants = await prisma.competitionParticipant.findMany({
      where: {
        competitionId: competition.id,
        isDisqualified: false,
      },
      include: {
        roundEntries: {
          include: {
            round: true,
            post: {
              include: {
                _count: {
                  select: {
                    likes: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    console.log(`Found ${participants.length} participants`);

    // Check which participants qualified through all rounds
    const qualifiedParticipantIds = [];
    const qualifiedParticipants = [];

    // For each participant, check if they qualified through all rounds except the last one
    for (const participant of participants) {
      console.log(
        `\nChecking qualification for participant: ${participant.user.username}`,
      );

      let qualified = true;

      // Check qualification for all rounds except the last one
      for (let i = 0; i < rounds.length - 1; i++) {
        const round = rounds[i];
        const entry = participant.roundEntries.find(
          (e) => e.roundId === round.id,
        );

        console.log(
          `Checking round ${round.name} for ${participant.user.username}:`,
        );
        console.log(`- Entry found: ${!!entry}`);
        console.log(`- Post exists: ${!!(entry && entry.post)}`);

        // If no entry or no post, they didn't qualify
        if (!entry || !entry.post) {
          qualified = false;
          console.log(
            `Participant ${participant.user.username} didn't post in round ${round.name}`,
          );
          break;
        }

        // If they didn't get enough likes, they didn't qualify
        const likesReceived = entry.post._count.likes;
        const likesRequired = round.likesToPass || 0;

        console.log(`- Likes received: ${likesReceived}`);
        console.log(`- Likes required: ${likesRequired}`);

        if (likesReceived < likesRequired) {
          qualified = false;
          console.log(
            `Participant ${participant.user.username} didn't get enough likes in round ${round.name}: ${likesReceived}/${likesRequired}`,
          );
          break;
        } else {
          console.log(
            `Participant ${participant.user.username} qualified in round ${round.name} with ${likesReceived}/${likesRequired} likes`,
          );
        }
      }

      // If they qualified through all previous rounds, check if they posted in the final round
      if (qualified) {
        const finalRoundEntry = participant.roundEntries.find(
          (e) => e.roundId === lastRound.id,
        );
        console.log(`Final round check for ${participant.user.username}:`);
        console.log(`- Final round entry exists: ${!!finalRoundEntry}`);
        console.log(
          `- Final round post exists: ${!!(finalRoundEntry && finalRoundEntry.post)}`,
        );

        if (finalRoundEntry && finalRoundEntry.post) {
          // Check if they got enough likes in the final round
          const likesReceived = finalRoundEntry.post._count.likes;
          const likesRequired = lastRound.likesToPass || 0;

          console.log(`- Final round likes received: ${likesReceived}`);
          console.log(`- Final round likes required: ${likesRequired}`);

          // Add to qualified participants if they got enough likes
          if (likesReceived >= likesRequired) {
            qualifiedParticipantIds.push(participant.id);
            qualifiedParticipants.push({
              participant,
              finalRoundEntry,
              likesReceived,
              postCreatedAt: finalRoundEntry.post.createdAt ? new Date(finalRoundEntry.post.createdAt) : new Date(),
            });
            console.log(
              `Participant ${participant.user.username} qualified for final round with ${likesReceived}/${likesRequired} likes`,
            );
          } else {
            console.log(
              `Participant ${participant.user.username} didn't get enough likes in final round: ${likesReceived}/${likesRequired}`,
            );
          }
        } else {
          console.log(
            `Participant ${participant.user.username} qualified but didn't post in final round`,
          );
        }
      } else {
        console.log(
          `Participant ${participant.user.username} did NOT qualify for final round`,
        );
      }
    }

    console.log(
      `\nFound ${qualifiedParticipants.length} qualified participants for the final round`,
    );

    // Sort qualified participants by likes received in the final round (descending)
    // If likes are equal, sort by post creation time (earlier submission wins)
    qualifiedParticipants.sort((a, b) => {
      // First sort by likes (descending)
      const likeDiff = b.likesReceived - a.likesReceived;

      // If likes are equal, use post creation time as tiebreaker (earlier submission wins)
      if (likeDiff === 0) {
        console.log(`Tiebreaker needed between ${a.participant.user.username} and ${b.participant.user.username} (both have ${a.likesReceived} likes)`);
        console.log(`Post creation times: ${a.participant.user.username}: ${a.postCreatedAt.toISOString()}, ${b.participant.user.username}: ${b.postCreatedAt.toISOString()}`);

        const timeDiff = a.postCreatedAt.getTime() - b.postCreatedAt.getTime();
        const winner = timeDiff <= 0 ? a.participant.user.username : b.participant.user.username;

        console.log(`Tiebreaker result: ${winner} wins (submitted earlier)`);
        return timeDiff;
      }

      return likeDiff;
    });

    // Get top entries (up to 3) for winner positions
    const winners = qualifiedParticipants.slice(0, 3).map((item, index) => {
      const position = index + 1;
      return {
        position,
        userId: item.participant.user.id,
        username: item.participant.user.username,
        displayName: item.participant.user.displayName,
        avatarUrl: item.participant.user.avatarUrl,
        likesReceived: item.likesReceived,
      };
    });

    console.log("\nWinners:");
    winners.forEach((winner) => {
      const participant = qualifiedParticipants.find(p => p.participant.user.id === winner.userId);
      const submissionTime = participant?.postCreatedAt ? participant.postCreatedAt.toISOString() : 'unknown';
      console.log(
        `- Position ${winner.position}: ${winner.username} with ${winner.likesReceived} likes (submitted at: ${submissionTime})`,
      );
    });

    // Update the competition's updatedAt timestamp to trigger a refresh
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        updatedAt: new Date(),
      },
    });

    console.log("\nCompetition updated with new timestamp");
    console.log("\nDone!");
  } catch (error) {
    console.error("Unhandled error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
