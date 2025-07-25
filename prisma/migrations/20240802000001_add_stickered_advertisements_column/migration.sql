-- Add showStickeredAdvertisements column to site_settings table if it doesn't exist
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showStickeredAdvertisements" BOOLEAN NOT NULL DEFAULT true;
