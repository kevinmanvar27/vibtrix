-- CreateEnum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "AdvertisementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SCHEDULED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "adType" "MediaType" NOT NULL,
    "mediaId" TEXT NOT NULL,
    "skipDuration" INTEGER NOT NULL,
    "displayFrequency" INTEGER NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "AdvertisementStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "post_media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
