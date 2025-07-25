-- Add showStickeredAdvertisements field to SiteSettings model
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showStickeredAdvertisements" BOOLEAN NOT NULL DEFAULT true;
