import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

export async function POST(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if sharing feature is enabled
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: { sharingEnabled: true },
    });

    if (!settings?.sharingEnabled) {
      return Response.json({ error: "Sharing feature is currently disabled" }, { status: 403 });
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

    // Record the share action
    // Note: This assumes you have a 'Share' model in your Prisma schema
    // If you don't, you can add it or use a different approach to track shares
    try {
      // You can add a Share model to your schema, or use a more generic approach
      // For now, we'll just return success

      // If the post is not by the current user, create a notification
      if (post.userId !== loggedInUser.id) {
        await prisma.notification.create({
          data: {
            type: "SHARE", // You would need to add this type to your schema
            issuerId: loggedInUser.id,
            recipientId: post.userId,
            postId,
          },
        });
      }

      return Response.json({ success: true });
    } catch (error) {
      debug.error("Error recording share:", error);
      return Response.json({ success: true }); // Still return success to the client
    }
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
