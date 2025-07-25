import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

export async function GET(
  req: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    // Validate user authentication
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const competitionId = params.competitionId;

    // Fetch competition stickers
    const stickers = await prisma.competitionSticker.findMany({
      where: {
        OR: [
          {
            DefaultStickers: {
              some: {
                competitionId,
              },
            },
          },
          {
            OptionalStickers: {
              some: {
                competitionId,
              },
            },
          },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        position: true,
        isDefault: true,
        limit: true,
        _count: {
          select: {
            usages: true,
          },
        },
        usages: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Filter out stickers that have reached their limit
    const availableStickers = stickers.filter(sticker => {
      if (!sticker.limit) return true; // No limit
      const activeUsages = sticker._count.usages - (sticker.usages?.length || 0);
      return activeUsages < sticker.limit;
    });

    return Response.json({ stickers: availableStickers });
  } catch (error) {
    debug.error("Error fetching competition stickers:", error);
    return Response.json(
      { error: "Failed to fetch stickers" },
      { status: 500 }
    );
  }
}
