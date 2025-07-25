import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { FollowerInfo } from "@/lib/types";

import debug from "@/lib/debug";

export async function GET(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();
    const isLoggedIn = !!loggedInUser;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        followers: isLoggedIn ? {
          where: {
            followerId: loggedInUser.id,
          },
          select: {
            followerId: true,
          },
        } : {
          where: {
            followerId: '', // This will return an empty array for guest users
          },
          select: {
            followerId: true,
          },
        },
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data: FollowerInfo = {
      followers: user._count.followers,
      isFollowedByUser: isLoggedIn ? !!user.followers.length : false,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the other user is already following the current user (mutual follow)
    const isAlreadyFollowingBack = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: loggedInUser.id,
        },
      },
    });

    // Determine notification type based on mutual follow status
    const notificationType = isAlreadyFollowingBack ? "MUTUAL_FOLLOW" : "FOLLOW";

    // Check if a notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        issuerId: loggedInUser.id,
        recipientId: userId,
        type: notificationType,
      },
    });

    // If this is a mutual follow, also check for and delete any regular FOLLOW notification
    // from the other user to avoid duplicate notifications
    const transactionOperations = [
      prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: loggedInUser.id,
            followingId: userId,
          },
        },
        create: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
        update: {},
      }),
      // Only create notification if it doesn't exist
      ...(!existingNotification ? [
        prisma.notification.create({
          data: {
            issuerId: loggedInUser.id,
            recipientId: userId,
            type: notificationType,
          },
        })
      ] : []),
    ];

    // If this is a mutual follow, also create a notification for the current user
    if (isAlreadyFollowingBack) {
      // Check if the other user already has a mutual follow notification
      const existingMutualNotificationForOtherUser = await prisma.notification.findFirst({
        where: {
          issuerId: userId,
          recipientId: loggedInUser.id,
          type: "MUTUAL_FOLLOW",
        },
      });

      // If the other user doesn't have a mutual follow notification yet, create one
      if (!existingMutualNotificationForOtherUser) {
        // Delete any existing FOLLOW notification from the other user
        transactionOperations.push(
          prisma.notification.deleteMany({
            where: {
              issuerId: userId,
              recipientId: loggedInUser.id,
              type: "FOLLOW",
            },
          })
        );

        // Create a mutual follow notification for the current user
        transactionOperations.push(
          prisma.notification.create({
            data: {
              issuerId: userId,
              recipientId: loggedInUser.id,
              type: "MUTUAL_FOLLOW",
            },
          })
        );
      }
    }

    await prisma.$transaction(transactionOperations);

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the other user is following the current user
    const isOtherUserFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: loggedInUser.id,
        },
      },
    });

    const transactionOperations = [
      // Delete the follow relationship
      prisma.follow.deleteMany({
        where: {
          followerId: loggedInUser.id,
          followingId: userId,
        },
      }),
      // Delete any FOLLOW notifications
      prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "FOLLOW",
        },
      }),
      // Delete any MUTUAL_FOLLOW notifications
      prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: userId,
          type: "MUTUAL_FOLLOW",
        },
      }),
    ];

    // If this was a mutual follow, update the other user's notification
    if (isOtherUserFollowing) {
      // Delete the mutual follow notification for the other user
      transactionOperations.push(
        prisma.notification.deleteMany({
          where: {
            issuerId: userId,
            recipientId: loggedInUser.id,
            type: "MUTUAL_FOLLOW",
          },
        })
      );

      // Create a regular FOLLOW notification for the other user
      transactionOperations.push(
        prisma.notification.create({
          data: {
            issuerId: userId,
            recipientId: loggedInUser.id,
            type: "FOLLOW",
          },
        })
      );
    }

    await prisma.$transaction(transactionOperations);

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
