import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { CommentsPage, getCommentDataInclude } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

    const pageSize = 5;

    const { user } = await validateRequest();
    const isLoggedIn = !!user;

    // For guest users, we'll still show comments
    // but with limited functionality

    // Check if comments feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { commentsEnabled: true },
    });

    if (!settings?.commentsEnabled) {
      return Response.json({ error: "Comments feature is currently disabled" }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: getCommentDataInclude(isLoggedIn ? user.id : ''),
      orderBy: { createdAt: "asc" },
      take: -pageSize - 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const previousCursor = comments.length > pageSize ? comments[0].id : null;

    const data: CommentsPage = {
      comments: comments.length > pageSize ? comments.slice(1) : comments,
      previousCursor,
    };

    return Response.json(data);
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
