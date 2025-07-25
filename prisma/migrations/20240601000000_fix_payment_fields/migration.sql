-- Ensure payment-related fields exist in the Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "entryFee" DOUBLE PRECISION;

-- Ensure hasPaid field exists in CompetitionParticipant
ALTER TABLE "competition_participants" ADD COLUMN IF NOT EXISTS "hasPaid" BOOLEAN NOT NULL DEFAULT false;

-- Ensure Razorpay fields exist in SiteSettings
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT;

-- Update PaymentGateway enum to include all values
DO $$
BEGIN
    -- Check if PAYTM, PHONEPE, GPAY exist in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAYTM' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'paymentgateway')
    ) THEN
        -- Add missing values to the enum
        ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PAYTM';
        ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'PHONEPE';
        ALTER TYPE "PaymentGateway" ADD VALUE IF NOT EXISTS 'GPAY';
    END IF;
END
$$;

-- Ensure all fields exist in the Payment model
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paymentId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "signature" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;

-- Copy data from transactionId to orderId if needed
UPDATE "payments" SET "orderId" = "transactionId" WHERE "orderId" IS NULL AND "transactionId" IS NOT NULL;
