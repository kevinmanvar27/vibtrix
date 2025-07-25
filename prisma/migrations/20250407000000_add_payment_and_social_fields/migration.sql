-- AlterTable
ALTER TABLE "users" ADD COLUMN "upiId" TEXT,
ADD COLUMN "showUpiId" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "socialLinks" JSONB;
