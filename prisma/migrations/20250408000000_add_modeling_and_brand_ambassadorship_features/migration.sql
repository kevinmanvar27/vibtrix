-- Add new fields to User model for modeling and brand ambassadorship
ALTER TABLE "users" ADD COLUMN "interestedInModeling" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "photoshootPricePerDay" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "videoAdsParticipation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "interestedInBrandAmbassadorship" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "brandAmbassadorshipPricing" TEXT;
ALTER TABLE "users" ADD COLUMN "brandPreferences" TEXT;

-- Add new fields to SiteSettings model for feature toggles
ALTER TABLE "site_settings" ADD COLUMN "modelingFeatureEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN "modelingMinFollowers" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "site_settings" ADD COLUMN "brandAmbassadorshipEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN "brandAmbassadorshipMinFollowers" INTEGER NOT NULL DEFAULT 1000;
