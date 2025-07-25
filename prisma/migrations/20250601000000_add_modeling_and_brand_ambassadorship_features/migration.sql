-- Add new fields to SiteSettings model for modeling feature
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "modelingFeatureEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "modelingMinFollowers" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "modelingPhotoshootLabel" TEXT DEFAULT 'Photoshoot Price Per Day';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "modelingVideoAdsLabel" TEXT DEFAULT 'Video Ads Note';

-- Add new fields to SiteSettings model for brand ambassadorship feature
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "brandAmbassadorshipEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "brandAmbassadorshipMinFollowers" INTEGER NOT NULL DEFAULT 5000;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "brandAmbassadorshipPricingLabel" TEXT DEFAULT 'Pricing Information';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "brandAmbassadorshipPreferencesLabel" TEXT DEFAULT 'Brand Preferences';
