-- AlterTable
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "competitions_slug_key" ON "competitions"("slug");
