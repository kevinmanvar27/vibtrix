-- Rename transactionId to orderId
ALTER TABLE "payments" RENAME COLUMN "transactionId" TO "orderId";

-- Add missing fields to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
