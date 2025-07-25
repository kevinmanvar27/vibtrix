-- Add hasPrizes field to Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "hasPrizes" BOOLEAN NOT NULL DEFAULT false;

-- Create PrizePosition enum
CREATE TYPE "PrizePosition" AS ENUM ('FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'PARTICIPATION');

-- Create PrizePaymentStatus enum
CREATE TYPE "PrizePaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Create CompetitionPrize table
CREATE TABLE "competition_prizes" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "position" "PrizePosition" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_prizes_pkey" PRIMARY KEY ("id")
);

-- Create PrizePayment table
CREATE TABLE "prize_payments" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PrizePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "upiId" TEXT,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_payments_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on CompetitionPrize
CREATE UNIQUE INDEX "competition_prizes_competitionId_position_key" ON "competition_prizes"("competitionId", "position");

-- Add foreign key constraints
ALTER TABLE "competition_prizes" ADD CONSTRAINT "competition_prizes_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prize_payments" ADD CONSTRAINT "prize_payments_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prize_payments" ADD CONSTRAINT "prize_payments_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "competition_prizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prize_payments" ADD CONSTRAINT "prize_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
