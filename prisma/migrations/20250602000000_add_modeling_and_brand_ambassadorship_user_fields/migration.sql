-- Add new fields to User model for modeling and brand ambassadorship
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interestedInModeling" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photoshootPricePerDay" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "videoAdsParticipation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interestedInBrandAmbassadorship" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brandAmbassadorshipPricing" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "brandPreferences" TEXT;
