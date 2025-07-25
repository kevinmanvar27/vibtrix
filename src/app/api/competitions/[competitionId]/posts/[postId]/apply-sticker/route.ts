import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { processImageWithSticker, processVideoWithSticker, isMediaEligibleForSticker } from "@/lib/imageProcessing";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

import debug from "@/lib/debug";

export async function POST(
  req: NextRequest,
  { params }: { params: { competitionId: string; postId: string } }
) {
  try {
    // Validate user authentication
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const competitionId = params.competitionId;
    const postId = params.postId;

    // Parse request body
    const { stickerId } = await req.json();

    if (!stickerId) {
      return Response.json(
        { error: "Sticker ID is required" },
        { status: 400 }
      );
    }

    // Verify the post belongs to the user and is part of the competition
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        authorId: user.id,
        CompetitionRoundEntry: {
          some: {
            participant: {
              competitionId,
            },
          },
        },
      },
      include: {
        attachments: true,
      },
    });

    if (!post) {
      return Response.json(
        { error: "Post not found or you don't have permission to modify it" },
        { status: 404 }
      );
    }

    // Verify the sticker exists and is available for this competition
    const sticker = await prisma.competitionSticker.findFirst({
      where: {
        id: stickerId,
        isActive: true,
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
      },
      include: {
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

    if (!sticker) {
      return Response.json(
        { error: "Sticker not found or not available for this competition" },
        { status: 404 }
      );
    }

    // Check if sticker has reached its limit
    if (sticker.limit) {
      const activeUsages = sticker._count.usages - (sticker.usages?.length || 0);
      if (activeUsages >= sticker.limit) {
        return Response.json(
          { error: "This sticker has reached its usage limit" },
          { status: 400 }
        );
      }
    }

    // Get the first attachment (assuming one attachment per competition post)
    const attachment = post.attachments[0];
    if (!attachment) {
      return Response.json(
        { error: "No media found in this post" },
        { status: 400 }
      );
    }

    // Get the file path from the URL
    const mediaUrl = attachment.url;
    const isLocalFile = mediaUrl.startsWith('/uploads/');
    
    if (!isLocalFile) {
      return Response.json(
        { error: "Cannot apply sticker to external media" },
        { status: 400 }
      );
    }

    // Get the file path
    const filePath = path.join(process.cwd(), 'public', mediaUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return Response.json(
        { error: "Media file not found" },
        { status: 404 }
      );
    }

    // Read the file
    const buffer = fs.readFileSync(filePath);
    
    // Check if media is eligible for sticker
    const isEligible = await isMediaEligibleForSticker(buffer, attachment.type);
    if (!isEligible) {
      return Response.json(
        { error: "This media is not eligible for stickers" },
        { status: 400 }
      );
    }

    // Process the media with the sticker
    let processedUrl;
    if (attachment.type === 'IMAGE') {
      processedUrl = await processImageWithSticker(
        buffer,
        path.basename(filePath),
        sticker.imageUrl,
        sticker.position
      );
    } else if (attachment.type === 'VIDEO') {
      processedUrl = await processVideoWithSticker(
        buffer,
        path.basename(filePath),
        sticker.imageUrl,
        sticker.position
      );
    } else {
      return Response.json(
        { error: "Unsupported media type" },
        { status: 400 }
      );
    }

    // Create a sticker usage record
    await prisma.stickerUsage.create({
      data: {
        stickerId: sticker.id,
        mediaUrl: processedUrl,
        postId: post.id,
      },
    });

    // Update the media record with the sticker ID
    await prisma.media.update({
      where: {
        id: attachment.id,
      },
      data: {
        appliedPromotionStickerId: sticker.id,
        url: processedUrl, // Update the URL to the stickered version
      },
    });

    return Response.json({
      success: true,
      message: "Sticker applied successfully",
      mediaUrl: processedUrl,
    });
  } catch (error) {
    debug.error("Error applying sticker to post:", error);
    return Response.json(
      { error: "Failed to apply sticker" },
      { status: 500 }
    );
  }
}
