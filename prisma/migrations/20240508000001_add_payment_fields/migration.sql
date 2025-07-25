-- Add missing fields to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;

-- Copy data from transactionId to orderId if needed
UPDATE "payments" SET "orderId" = "transactionId" WHERE "orderId" IS NULL AND "transactionId" IS NOT NULL;
