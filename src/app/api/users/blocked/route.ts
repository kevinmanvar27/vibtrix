import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";

import debug from "@/lib/debug";

// GET endpoint to retrieve the list of users blocked by the current user
export async function GET(request: Request) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users that the current user has blocked
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: loggedInUser.id,
      },
      include: {
        blocked: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
    });

    // Extract just the user data from the results
    const users = blockedUsers.map((block) => block.blocked);

    return Response.json({ users });
  } catch (error) {
    debug.error("Error fetching blocked users:", error);
    return Response.json(
      { error: "Failed to fetch blocked users" },
      { status: 500 }
    );
  }
}
