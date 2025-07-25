-- Add showFeedStickers column to site_settings table
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showFeedStickers" BOOLEAN NOT NULL DEFAULT true;
