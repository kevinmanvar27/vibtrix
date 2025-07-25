-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SHARE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isProfilePublic" BOOLEAN NOT NULL DEFAULT true;
