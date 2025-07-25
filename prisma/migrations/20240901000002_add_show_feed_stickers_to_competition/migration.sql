-- Add showFeedStickers column to competitions table
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "showFeedStickers" BOOLEAN NOT NULL DEFAULT true;
