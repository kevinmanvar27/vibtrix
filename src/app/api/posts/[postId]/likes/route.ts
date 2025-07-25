import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";

import debug from "@/lib/debug";

export async function GET(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    // For GET requests, allow non-logged-in users to see like counts
    // but set isLikedByUser to false
    const isLoggedIn = !!loggedInUser;

    // Different query based on authentication status
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        // Only include likes where userId matches if user is logged in
        ...(isLoggedIn ? {
          likes: {
            where: {
              userId: loggedInUser.id,
            },
            select: {
              userId: true,
            },
          },
        } : {}),
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const data: LikeInfo = {
      likes: post._count.likes,
      // If user is not logged in, they haven't liked the post
      isLikedByUser: isLoggedIn ? !!(post.likes?.length) : false,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      // Return a special status code that the client can use to trigger a login redirect
      return Response.json({
        error: "Authentication required",
        redirectToLogin: true
      }, { status: 401 });
    }

    // Check if likes feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { likesEnabled: true },
    });

    if (!settings?.likesEnabled) {
      return Response.json({ error: "Likes feature is currently disabled" }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.like.upsert({
        where: {
          userId_postId: {
            userId: loggedInUser.id,
            postId,
          },
        },
        create: {
          userId: loggedInUser.id,
          postId,
        },
        update: {},
      }),
      ...(loggedInUser.id !== post.userId
        ? [
          prisma.notification.create({
            data: {
              issuerId: loggedInUser.id,
              recipientId: post.userId,
              postId,
              type: "LIKE",
            },
          }),
        ]
        : []),
    ]);

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      // Return a special status code that the client can use to trigger a login redirect
      return Response.json({
        error: "Authentication required",
        redirectToLogin: true
      }, { status: 401 });
    }

    // Check if likes feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { likesEnabled: true },
    });

    if (!settings?.likesEnabled) {
      return Response.json({ error: "Likes feature is currently disabled" }, { status: 403 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.like.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      }),
      prisma.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: post.userId,
          postId,
          type: "LIKE",
        },
      }),
    ]);

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
