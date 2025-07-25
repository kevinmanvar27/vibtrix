-- Add showStickeredMedia field to Competition model
ALTER TABLE "competitions" ADD COLUMN "showStickeredMedia" BOOLEAN NOT NULL DEFAULT true;
