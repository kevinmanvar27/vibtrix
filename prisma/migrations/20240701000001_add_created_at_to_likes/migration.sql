-- Add createdAt field to likes table with default value of now()
ALTER TABLE "likes" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
