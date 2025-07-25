-- CreateEnum
CREATE TYPE "CompetitionMediaType" AS ENUM ('IMAGE_ONLY', 'VIDEO_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "StickerPosition" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('PAYTM', 'PHONEPE', 'GPAY', 'RAZORPAY');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rounds" INTEGER NOT NULL DEFAULT 1,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "entryFee" DOUBLE PRECISION,
    "mediaType" "CompetitionMediaType" NOT NULL DEFAULT 'BOTH',
    "minLikes" INTEGER,
    "maxDuration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_participants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "postIds" TEXT[],
    "isDisqualified" BOOLEAN NOT NULL DEFAULT false,
    "disqualifyReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_stickers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" "StickerPosition" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "transactionId" TEXT,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "refundReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'settings',
    "maxImageSize" INTEGER NOT NULL DEFAULT 5242880,
    "minVideoDuration" INTEGER NOT NULL DEFAULT 3,
    "maxVideoDuration" INTEGER NOT NULL DEFAULT 60,
    "preloaderUrl" TEXT,
    "backgroundDesktop" TEXT,
    "backgroundMobile" TEXT,
    "backgroundTablet" TEXT,
    "logoUrl" TEXT,
    "googleLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "manualSignupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paytmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phonePeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DefaultStickers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OptionalStickers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "competition_participants_userId_competitionId_key" ON "competition_participants"("userId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_DefaultStickers_AB_unique" ON "_DefaultStickers"("A", "B");

-- CreateIndex
CREATE INDEX "_DefaultStickers_B_index" ON "_DefaultStickers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OptionalStickers_AB_unique" ON "_OptionalStickers"("A", "B");

-- CreateIndex
CREATE INDEX "_OptionalStickers_B_index" ON "_OptionalStickers"("B");

-- AddForeignKey
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_participants" ADD CONSTRAINT "competition_participants_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DefaultStickers" ADD CONSTRAINT "_DefaultStickers_A_fkey" FOREIGN KEY ("A") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DefaultStickers" ADD CONSTRAINT "_DefaultStickers_B_fkey" FOREIGN KEY ("B") REFERENCES "competition_stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalStickers" ADD CONSTRAINT "_OptionalStickers_A_fkey" FOREIGN KEY ("A") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionalStickers" ADD CONSTRAINT "_OptionalStickers_B_fkey" FOREIGN KEY ("B") REFERENCES "competition_stickers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
