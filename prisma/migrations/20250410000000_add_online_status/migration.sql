-- CreateEnum
CREATE TYPE "OnlineStatus" AS ENUM ('ONLINE', 'IDLE', 'OFFLINE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "onlineStatus" "OnlineStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN "lastActiveAt" TIMESTAMP(3);
