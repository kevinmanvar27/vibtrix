import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { MessageCountInfo } from "@/lib/types";

import debug from "@/lib/debug";

export async function GET() {
  try {
    debug.log('GET /api/messages/unread-count - Starting request');
    const { user } = await validateRequest();

    if (!user) {
      debug.log('GET /api/messages/unread-count - Unauthorized');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    debug.log('GET /api/messages/unread-count - User authenticated:', user.id);

    // Count chats where the user has unread messages
    let unreadCount = 0;
    try {
      unreadCount = await prisma.chatParticipant.count({
        where: {
          userId: user.id,
          hasUnread: true,
        },
      });

      debug.log('GET /api/messages/unread-count - Unread count:', unreadCount);
    } catch (error) {
      debug.error("Error counting unread messages:", error);
      // Default to 0 if there's an error
    }

    // Add cache control headers to prevent caching
    const headers = new Headers();
    headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');

    const data: MessageCountInfo = {
      unreadCount,
    };

    return Response.json(data, { headers });
  } catch (error) {
    debug.error("Error in unread count API:", error);
    // Return 0 unread messages instead of an error
    return Response.json({ unreadCount: 0 });
  }
}
