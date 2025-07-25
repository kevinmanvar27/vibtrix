-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isManagementUser" BOOLEAN NOT NULL DEFAULT false;
