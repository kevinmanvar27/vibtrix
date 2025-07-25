-- Add payment-related fields to the Competition model
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "entryFee" DOUBLE PRECISION;

-- Add hasPaid field to CompetitionParticipant
ALTER TABLE "competition_participants" ADD COLUMN IF NOT EXISTS "hasPaid" BOOLEAN NOT NULL DEFAULT false;

-- Add Razorpay fields to SiteSettings
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT;

-- Create PaymentStatus enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentstatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
    END IF;
END
$$;

-- Create PaymentGateway enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentgateway') THEN
        CREATE TYPE "PaymentGateway" AS ENUM ('RAZORPAY');
    END IF;
END
$$;

-- Create Payment table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "signature" TEXT,
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "refundReason" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_competitionId_fkey" 
    FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
