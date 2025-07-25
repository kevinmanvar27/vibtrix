-- Add showStickeredMediaInFeed field to SiteSettings model
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "showStickeredMediaInFeed" BOOLEAN NOT NULL DEFAULT true;
