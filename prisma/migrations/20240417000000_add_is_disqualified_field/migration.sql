-- AlterTable
ALTER TABLE "competition_participants" ADD COLUMN IF NOT EXISTS "isDisqualified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "competition_participants" ADD COLUMN IF NOT EXISTS "disqualifyReason" TEXT;
