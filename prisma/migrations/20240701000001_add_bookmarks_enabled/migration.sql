-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "bookmarksEnabled" BOOLEAN NOT NULL DEFAULT true;
