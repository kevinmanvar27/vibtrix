-- Add winnerPosition field to CompetitionRoundEntry model
ALTER TABLE "competition_round_entries" ADD COLUMN IF NOT EXISTS "winnerPosition" INTEGER;
