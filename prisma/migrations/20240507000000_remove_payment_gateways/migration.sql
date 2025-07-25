-- Drop the Payment model
DROP TABLE IF EXISTS "payments";

-- Remove payment-related fields from the Competition model
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "isPaid";
ALTER TABLE "competitions" DROP COLUMN IF EXISTS "entryFee";

-- Remove payment-related fields from the SiteSettings model
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "paytmEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "phonePeEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "gPayEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "razorpayEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "razorpayKeyId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "razorpayKeySecret";
