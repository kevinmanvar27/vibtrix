-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "viewsEnabled" BOOLEAN NOT NULL DEFAULT true;
