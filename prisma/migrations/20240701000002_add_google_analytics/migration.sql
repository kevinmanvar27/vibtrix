-- Add Google Analytics fields to site_settings
ALTER TABLE "site_settings" 
ADD COLUMN IF NOT EXISTS "googleAnalyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "googleAnalyticsId" TEXT;
