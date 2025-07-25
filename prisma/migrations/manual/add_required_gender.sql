-- Add requiredGender column to competitions table
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "requiredGender" TEXT;
