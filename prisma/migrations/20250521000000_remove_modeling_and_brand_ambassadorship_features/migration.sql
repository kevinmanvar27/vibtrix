-- Remove fields from User model for modeling and brand ambassadorship
ALTER TABLE "users" DROP COLUMN IF EXISTS "interestedInModeling";
ALTER TABLE "users" DROP COLUMN IF EXISTS "photoshootPricePerDay";
ALTER TABLE "users" DROP COLUMN IF EXISTS "videoAdsParticipation";
ALTER TABLE "users" DROP COLUMN IF EXISTS "interestedInBrandAmbassadorship";
ALTER TABLE "users" DROP COLUMN IF EXISTS "brandAmbassadorshipPricing";
ALTER TABLE "users" DROP COLUMN IF EXISTS "brandPreferences";

-- Remove fields from SiteSettings model for feature toggles
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "modelingFeatureEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "modelingMinFollowers";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "brandAmbassadorshipEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "brandAmbassadorshipMinFollowers";
