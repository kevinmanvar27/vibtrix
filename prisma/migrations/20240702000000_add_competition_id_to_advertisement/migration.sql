-- Add competitionId field to advertisements table
ALTER TABLE "advertisements" ADD COLUMN "competitionId" TEXT NULL;

-- Add foreign key constraint
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "advertisements_competitionId_idx" ON "advertisements"("competitionId");
