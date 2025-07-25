/*
  Warnings:

  - You are about to drop the column `endDate` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `rounds` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `rules` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `competitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "competitions" DROP COLUMN "endDate",
DROP COLUMN "rounds",
DROP COLUMN "rules",
DROP COLUMN "startDate";

-- CreateTable
CREATE TABLE "competition_rounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "likesToPass" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_rounds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "competition_rounds" ADD CONSTRAINT "competition_rounds_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
