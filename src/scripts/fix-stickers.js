// Script to fix stickers for existing competition posts
// This script will:
// 1. Find all competition posts that have a sticker ID but no stickered image
// 2. Apply the sticker to the original image
// 3. Save the stickered image with the same filename in the stickered folder

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createCanvas, loadImage } = require("canvas");

const prisma = new PrismaClient();

// Base directory for file storage
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ORIGINAL_DIR = path.join(UPLOAD_DIR, "original");
const STICKERED_DIR = path.join(UPLOAD_DIR, "stickered");

// Ensure the stickered directory exists
if (!fs.existsSync(STICKERED_DIR)) {
  fs.mkdirSync(STICKERED_DIR, { recursive: true });
}

async function applySticker(originalUrl, stickerUrl, position) {
  console.log(`Applying sticker to ${originalUrl}`);

  // Extract the filename from the original URL
  const filename = path.basename(originalUrl);

  // Load the original image
  const originalPath = path.join(process.cwd(), "public", originalUrl);
  const image = await loadImage(originalPath);

  // Create a canvas with the same dimensions as the image
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw the original image onto the canvas
  ctx.drawImage(image, 0, 0, image.width, image.height);

  // Load the sticker image
  let stickerPath = stickerUrl;
  if (stickerUrl && stickerUrl.startsWith("/uploads/")) {
    stickerPath = path.join(process.cwd(), "public", stickerUrl);
  } else if (!stickerUrl) {
    // Use a default sticker if none is provided
    stickerPath = path.join(process.cwd(), "public", "/uploads/sticker.png");
    console.log(`Using default sticker: ${stickerPath}`);
  }

  const sticker = await loadImage(stickerPath);

  // Calculate sticker dimensions (as a percentage of the image width)
  const stickerSize = 0.2; // 20% of image width
  const stickerWidth = image.width * stickerSize;
  const stickerHeight = (sticker.height / sticker.width) * stickerWidth;

  // Calculate position coordinates
  let x = 0;
  let y = 0;
  const padding = image.width * 0.02; // 2% padding

  // Default to BOTTOM_RIGHT if position is not provided
  const stickerPosition = position || "BOTTOM_RIGHT";

  switch (stickerPosition) {
    case "TOP_LEFT":
      x = padding;
      y = padding;
      break;
    case "TOP_RIGHT":
      x = image.width - stickerWidth - padding;
      y = padding;
      break;
    case "BOTTOM_LEFT":
      x = padding;
      y = image.height - stickerHeight - padding;
      break;
    case "BOTTOM_RIGHT":
      x = image.width - stickerWidth - padding;
      y = image.height - stickerHeight - padding;
      break;
    case "CENTER":
      x = (image.width - stickerWidth) / 2;
      y = (image.height - stickerHeight) / 2;
      break;
    default:
      x = image.width - stickerWidth - padding; // Default to BOTTOM_RIGHT
      y = image.height - stickerHeight - padding;
  }

  // Draw the sticker onto the canvas
  ctx.drawImage(sticker, x, y, stickerWidth, stickerHeight);

  // Save the stickered image
  const stickeredPath = path.join(STICKERED_DIR, filename);
  const stickeredUrl = `/uploads/stickered/${filename}`;

  // Convert the canvas to a buffer and save it
  const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
  fs.writeFileSync(stickeredPath, buffer);

  console.log(`Stickered image saved to ${stickeredPath}`);

  return stickeredUrl;
}

async function fixStickers() {
  try {
    // Find all media with applied stickers
    const mediaWithStickers = await prisma.media.findMany({
      where: {
        appliedPromotionStickerId: {
          not: null,
        },
      },
      include: {
        appliedPromotionSticker: true,
      },
    });

    console.log(`Found ${mediaWithStickers.length} media items with stickers`);

    for (const media of mediaWithStickers) {
      // Check if the media URL is from the original folder
      if (media.url.startsWith("/uploads/original/")) {
        const originalUrl = media.url;
        const filename = path.basename(originalUrl);
        const stickeredUrl = `/uploads/stickered/${filename}`;
        const stickeredPath = path.join(process.cwd(), "public", stickeredUrl);

        // Check if the stickered file already exists
        if (!fs.existsSync(stickeredPath)) {
          console.log(
            `Stickered file not found for ${originalUrl}, creating it...`,
          );

          try {
            // Get the sticker URL and position
            const stickerUrl = media.appliedPromotionSticker
              ? media.appliedPromotionSticker.stickerUrl
              : null;
            const position = media.appliedPromotionSticker
              ? media.appliedPromotionSticker.position
              : "BOTTOM_RIGHT";

            console.log(
              `Using sticker URL: ${stickerUrl || "default"}, position: ${position}`,
            );

            // Apply the sticker
            const newStickeredUrl = await applySticker(
              originalUrl,
              stickerUrl,
              position,
            );

            // Update the media record to point to the stickered URL
            await prisma.media.update({
              where: { id: media.id },
              data: { url: newStickeredUrl },
            });

            console.log(
              `Updated media record ${media.id} to use stickered URL: ${newStickeredUrl}`,
            );
          } catch (error) {
            console.error(`Error processing ${originalUrl}:`, error);
          }
        } else {
          console.log(
            `Stickered file already exists for ${originalUrl}, updating media record...`,
          );

          // Update the media record to point to the stickered URL
          await prisma.media.update({
            where: { id: media.id },
            data: { url: stickeredUrl },
          });

          console.log(
            `Updated media record ${media.id} to use stickered URL: ${stickeredUrl}`,
          );
        }
      } else if (!media.url.startsWith("/uploads/stickered/")) {
        console.log(
          `Media ${media.id} has URL ${media.url} which is not in the original folder, skipping...`,
        );
      } else {
        console.log(
          `Media ${media.id} already has stickered URL: ${media.url}`,
        );
      }
    }

    console.log("Sticker fix completed successfully");
  } catch (error) {
    console.error("Error fixing stickers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixStickers()
  .then(() => {
    console.log("Script completed");
  })
  .catch((error) => {
    console.error("Script failed:", error);
  });
