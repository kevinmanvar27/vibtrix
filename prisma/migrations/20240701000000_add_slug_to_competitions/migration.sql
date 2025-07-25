-- AlterTable
ALTER TABLE "competitions" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "competitions_slug_key" ON "competitions"("slug");
