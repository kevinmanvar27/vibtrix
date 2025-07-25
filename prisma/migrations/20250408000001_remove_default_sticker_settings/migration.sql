-- Remove default sticker fields from SiteSettings
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "defaultStickerId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "defaultStickerPosition";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "alwaysApplySticker";
