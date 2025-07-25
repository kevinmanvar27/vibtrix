-- Add completionReason field to Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "completionReason" TEXT;
