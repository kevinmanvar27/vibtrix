import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  request: NextRequest,
  { params: { postId } }: { params: { postId: string } }
) {
  try {
    debug.log(`GET /api/posts/${postId} - Starting request`);
    const { user } = await validateRequest();

    if (!user) {
      debug.log(`GET /api/posts/${postId} - Unauthorized`);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log(`GET /api/posts/${postId} - User authenticated:`, user.id);

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            onlineStatus: true,
          },
        },
        attachments: true,
        likes: {
          where: { userId: user.id },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId: user.id },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      debug.log(`GET /api/posts/${postId} - Post not found`);
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post is by a blocked user
    const isBlockedByUser = await prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: post.userId },
          { blockerId: post.userId, blockedId: user.id },
        ],
      },
    });

    if (isBlockedByUser) {
      debug.log(`GET /api/posts/${postId} - Post by blocked user`);
      return Response.json(
        { error: "Post not available" },
        { status: 403 }
      );
    }

    debug.log(`GET /api/posts/${postId} - Post found`);
    return Response.json(post);
  } catch (error) {
    debug.error(`Error fetching post ${postId}:`, error);
    return Response.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
