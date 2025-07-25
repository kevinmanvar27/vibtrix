-- CreateTable
CREATE TABLE "sticker_usages" (
    "id" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticker_usages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sticker_usages" ADD CONSTRAINT "sticker_usages_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "promotion_stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
