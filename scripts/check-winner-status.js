// This script checks the winner status for a user in a competition
// Usage: node scripts/check-winner-status.js <competitionId> <username>

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the competition ID and username from command line arguments
    const competitionId = process.argv[2];
    const username = process.argv[3];
    
    if (!competitionId || !username) {
      console.error('Error: Competition ID and username are required');
      console.log('Usage: node scripts/check-winner-status.js <competitionId> <username>');
      process.exit(1);
    }

    console.log(`Checking winner status for user ${username} in competition: ${competitionId}`);

    // Get competition details
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      console.error(`Error: Competition with ID ${competitionId} not found`);
      process.exit(1);
    }

    console.log(`Found competition: "${competition.title}" with ${competition.rounds.length} rounds`);

    // Get the user
    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (!user) {
      console.error(`Error: User with username ${username} not found`);
      process.exit(1);
    }

    console.log(`Found user: ${user.username} (ID: ${user.id})`);

    // Get the participant
    const participant = await prisma.competitionParticipant.findFirst({
      where: {
        competitionId,
        userId: user.id,
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
      },
    });

    if (!participant) {
      console.error(`Error: User ${username} is not a participant in this competition`);
      process.exit(1);
    }

    console.log(`Found participant with ID: ${participant.id}`);

    // Get the last round
    const lastRound = competition.rounds[competition.rounds.length - 1];
    console.log(`Last round: "${lastRound.name}"`);

    // Check if the participant has an entry in the last round
    const finalRoundEntry = participant.roundEntries.find(e => e.roundId === lastRound.id);
    
    if (finalRoundEntry) {
      console.log(`Final round entry found with ID: ${finalRoundEntry.id}`);
      console.log(`- Has post: ${!!finalRoundEntry.post}`);
      console.log(`- Winner position: ${finalRoundEntry.winnerPosition !== null ? finalRoundEntry.winnerPosition : 'Not a winner'}`);
      console.log(`- Visible in competition feed: ${finalRoundEntry.visibleInCompetitionFeed}`);
      console.log(`- Visible in normal feed: ${finalRoundEntry.visibleInNormalFeed}`);
      console.log(`- Qualified for next round: ${finalRoundEntry.qualifiedForNextRound !== null ? finalRoundEntry.qualifiedForNextRound : 'Not set'}`);
      
      if (finalRoundEntry.post) {
        console.log(`- Post ID: ${finalRoundEntry.post.id}`);
        console.log(`- Likes: ${finalRoundEntry.post._count.likes}`);
      }
    } else {
      console.log(`No entry found for the final round`);
    }

    // Check qualification status for each round
    console.log('\nQualification status for each round:');
    for (const round of competition.rounds) {
      const entry = participant.roundEntries.find(e => e.roundId === round.id);
      const likesReceived = entry?.post?._count?.likes || 0;
      const likesRequired = round.likesToPass || 0;
      const qualified = likesReceived >= likesRequired;
      
      console.log(`- Round "${round.name}":`);
      console.log(`  - Has entry: ${!!entry}`);
      console.log(`  - Has post: ${!!(entry && entry.post)}`);
      console.log(`  - Likes received: ${likesReceived}`);
      console.log(`  - Likes required: ${likesRequired}`);
      console.log(`  - Qualified: ${qualified}`);
      
      if (entry) {
        console.log(`  - Qualified for next round (DB): ${entry.qualifiedForNextRound !== null ? entry.qualifiedForNextRound : 'Not set'}`);
        console.log(`  - Visible in competition feed: ${entry.visibleInCompetitionFeed}`);
        console.log(`  - Visible in normal feed: ${entry.visibleInNormalFeed}`);
      }
    }

    // Check if the participant is qualified for the final round
    let qualifiedForFinalRound = true;
    for (let i = 0; i < competition.rounds.length - 1; i++) {
      const round = competition.rounds[i];
      const entry = participant.roundEntries.find(e => e.roundId === round.id);
      
      if (!entry || !entry.post) {
        qualifiedForFinalRound = false;
        break;
      }
      
      const likesReceived = entry.post._count.likes;
      const likesRequired = round.likesToPass || 0;
      
      if (likesReceived < likesRequired) {
        qualifiedForFinalRound = false;
        break;
      }
    }
    
    console.log(`\nQualified for final round: ${qualifiedForFinalRound}`);
    
    // Check if the participant is a winner
    const isWinner = finalRoundEntry?.winnerPosition !== null && finalRoundEntry?.winnerPosition !== undefined;
    console.log(`Is winner: ${isWinner}`);
    
    if (isWinner) {
      console.log(`Winner position: ${finalRoundEntry.winnerPosition}`);
    }

    console.log('\nDone!');
  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
