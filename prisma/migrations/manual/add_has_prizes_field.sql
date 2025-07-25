-- Add hasPrizes field to Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "hasPrizes" BOOLEAN NOT NULL DEFAULT false;
