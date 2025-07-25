-- Add defaultHashtag field to Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "defaultHashtag" TEXT;
