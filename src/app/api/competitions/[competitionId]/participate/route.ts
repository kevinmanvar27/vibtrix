import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = params;

    // Check if the competition exists
    const competition = await prisma.competition.findUnique({
      where: {
        id: competitionId,
      },
      include: {
        rounds: {
          orderBy: {
            startDate: 'asc',
          },
        },
      },
    });

    if (!competition) {
      return Response.json({ error: "Competition not found" }, { status: 404 });
    }

    // Check if the competition is active in the database
    if (!competition.isActive) {
      return Response.json({ error: "Competition is not active" }, { status: 400 });
    }

    // Get the current date
    const currentDate = new Date();
    const firstRound = competition.rounds[0];

    // Check if the first round has completed
    if (firstRound && new Date(firstRound.endDate) < currentDate) {
      return Response.json({
        error: "Enrollment for this competition has ended"
      }, { status: 400 });
    }

    // Check if the competition has ended
    const lastRound = competition.rounds[competition.rounds.length - 1];

    if (lastRound && new Date(lastRound.endDate) < currentDate) {
      return Response.json({
        error: "Competition has already ended"
      }, { status: 400 });
    }

    // Check if the user is already a participant
    const existingParticipant = await prisma.competitionParticipant.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId,
        },
      },
    });

    if (existingParticipant) {
      return Response.json({
        error: "You are already participating in this competition"
      }, { status: 400 });
    }

    // Get user profile for validation
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        dateOfBirth: true,
        gender: true
      },
    });

    // Check age restrictions if they exist
    if (competition.minAge || competition.maxAge) {
      try {
        if (userProfile?.dateOfBirth) {
          // Parse the date of birth which is stored in DD-MM-YYYY format
          const [day, month, year] = userProfile.dateOfBirth.split('-').map(Number);

          // Create a valid date object (months are 0-indexed in JavaScript)
          const birthDate = new Date(year, month - 1, day);

          // Log for debugging
          debug.log("Date of birth:", userProfile.dateOfBirth);
          debug.log("Parsed birth date:", birthDate);

          // Calculate age
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          // Adjust age if birthday hasn't occurred yet this year
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }

          debug.log("Calculated age:", age);
          debug.log("Competition age range:", competition.minAge, "-", competition.maxAge);

          if (competition.minAge && age < competition.minAge) {
            return Response.json({
              error: `You must be at least ${competition.minAge} years old to participate. Your current age is ${age}.`
            }, { status: 400 });
          }

          if (competition.maxAge && age > competition.maxAge) {
            return Response.json({
              error: `You must be ${competition.maxAge} years old or younger to participate. Your current age is ${age}.`
            }, { status: 400 });
          }
        } else if (competition.minAge || competition.maxAge) {
          // If user doesn't have a date of birth but competition has age restrictions
          return Response.json({
            error: `Please update your profile with your date of birth to participate in age-restricted competitions`
          }, { status: 400 });
        }
      } catch (error) {
        debug.error("Error checking age restrictions:", error);
        return Response.json({
          error: `Error validating age requirements. Please try again later.`
        }, { status: 500 });
      }
    }

    // Check gender restrictions if they exist
    if (competition.requiredGender && competition.requiredGender !== "none") {
      debug.log("Competition gender restriction:", competition.requiredGender);
      debug.log("User gender:", userProfile?.gender);

      // If user hasn't set their gender, they can't join gender-restricted competitions
      if (!userProfile?.gender) {
        return Response.json({
          error: `This competition is only open to ${competition.requiredGender} participants. Please update your profile with your gender to participate.`
        }, { status: 400 });
      }

      // Check if user's gender matches the required gender
      if (userProfile.gender !== competition.requiredGender) {
        return Response.json({
          error: `This competition is only open to ${competition.requiredGender} participants.`
        }, { status: 400 });
      }

      debug.log("User gender matches competition requirement");
    } else {
      debug.log("No gender restriction for this competition");
    }


    // Check if the competition requires payment
    if (competition.isPaid && competition.entryFee) {
      debug.log(`Competition ${competitionId} requires payment of ${competition.entryFee} INR`);

      // Check if the user has already paid
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          competitionId,
          status: "COMPLETED",
        },
      });

      debug.log(`User ${user.id} payment status:`, existingPayment ? "Already paid" : "Not paid");

      // If payment exists, create a participant record
      if (existingPayment) {
        const participant = await prisma.competitionParticipant.create({
          data: {
            userId: user.id,
            competitionId,
            hasPaid: true // Payment is verified
          },
        });

        return Response.json({
          success: true,
          message: "Successfully joined the competition",
          participant,
        });
      } else {
        // If payment is required but not yet made, return payment required status
        // WITHOUT creating a participant record
        return Response.json({
          success: true,
          message: "Payment required to join this competition",
          paymentRequired: true,
          amount: competition.entryFee,
          currency: "INR",
        });
      }
    } else {
      debug.log(`Competition ${competitionId} is free`);

      // For free competitions, create participant normally
      const participant = await prisma.competitionParticipant.create({
        data: {
          userId: user.id,
          competitionId,
          hasPaid: true // Free competitions are automatically marked as paid
        },
      });

      return Response.json({
        success: true,
        message: "Successfully joined the competition",
        participant,
      });
    }
  } catch (error) {
    debug.error("Error joining competition:", error);
    return Response.json(
      { error: "Failed to join competition" },
      { status: 500 }
    );
  }
}
