import prisma from "@/lib/prisma";
import debug from "@/lib/debug";

export async function GET() {
  try {
    // Get site settings
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "settings" },
      select: {
        // Firebase settings
        firebaseEnabled: true,
        pushNotificationsEnabled: true,

        // Feature settings
        likesEnabled: true,
        commentsEnabled: true,
        sharingEnabled: true,
        messagingEnabled: true,
        userBlockingEnabled: true,
        loginActivityTrackingEnabled: true,
        viewsEnabled: true,
        bookmarksEnabled: true,
        advertisementsEnabled: true,
        reportingEnabled: true,
      },
    });

    if (!settings) {
      return Response.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    return Response.json(settings);
  } catch (error) {
    debug.error("Error fetching settings:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
