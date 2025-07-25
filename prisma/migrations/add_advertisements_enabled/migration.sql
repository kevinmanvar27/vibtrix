-- Add advertisementsEnabled field to site_settings table
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "advertisementsEnabled" BOOLEAN NOT NULL DEFAULT true;
