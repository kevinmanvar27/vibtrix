-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hideYear" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "showDob" SET DEFAULT false;
