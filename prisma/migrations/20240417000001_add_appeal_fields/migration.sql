-- AlterTable
ALTER TABLE "competition_participants" ADD COLUMN IF NOT EXISTS "hasAppealedDisqualification" BOOLEAN NOT NULL DEFAULT false;
