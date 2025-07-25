/*
  Warnings:

  - You are about to drop the column `postIds` on the `competition_participants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "competition_participants" DROP COLUMN "postIds";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dateOfBirth" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "competition_round_entries" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_round_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competition_round_entries_participantId_roundId_key" ON "competition_round_entries"("participantId", "roundId");

-- AddForeignKey
ALTER TABLE "competition_round_entries" ADD CONSTRAINT "competition_round_entries_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "competition_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_round_entries" ADD CONSTRAINT "competition_round_entries_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "competition_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_round_entries" ADD CONSTRAINT "competition_round_entries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
