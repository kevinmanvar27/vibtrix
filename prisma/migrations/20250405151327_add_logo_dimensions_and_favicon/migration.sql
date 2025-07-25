-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "logoHeight" INTEGER DEFAULT 80,
ADD COLUMN     "logoWidth" INTEGER DEFAULT 200;
