import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getChatInclude } from "@/lib/types";
import { NextRequest } from "next/server";

import debug from "@/lib/debug";

interface RouteParams {
  params: {
    chatId: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = params;

    // Check if user is a participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId: user.id,
          chatId,
        },
      },
    });

    if (!participant) {
      return Response.json(
        { error: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: getChatInclude(user.id),
    });

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    debug.error("Error fetching chat:", error);
    return Response.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}
