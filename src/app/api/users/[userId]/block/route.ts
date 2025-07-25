import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

// POST endpoint to block a user
export async function POST(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user blocking feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { userBlockingEnabled: true },
    });

    if (!settings?.userBlockingEnabled) {
      return Response.json({ error: "User blocking feature is currently disabled" }, { status: 403 });
    }

    // Prevent blocking yourself
    if (loggedInUser.id === userId) {
      return Response.json(
        { error: "You cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if the user to block exists
    const userToBlock = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToBlock) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Create the block relationship
    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: loggedInUser.id,
          blockedId: userId,
        },
      },
      create: {
        blockerId: loggedInUser.id,
        blockedId: userId,
      },
      update: {},
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    debug.error("Error blocking user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to unblock a user
export async function DELETE(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user blocking feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { userBlockingEnabled: true },
    });

    if (!settings?.userBlockingEnabled) {
      return Response.json({ error: "User blocking feature is currently disabled" }, { status: 403 });
    }

    // Delete the block relationship
    await prisma.userBlock.deleteMany({
      where: {
        blockerId: loggedInUser.id,
        blockedId: userId,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    debug.error("Error unblocking user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
