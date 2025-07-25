import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

import debug from "@/lib/debug";

export async function PATCH() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return new Response();
  } catch (error) {
    debug.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
