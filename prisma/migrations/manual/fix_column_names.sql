-- Drop columns with camelCase names if they exist
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseEnabled";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseApiKey";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseAuthDomain";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseProjectId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseStorageBucket";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseMessagingSenderId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseAppId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "firebaseMeasurementId";
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "pushNotificationsEnabled";

ALTER TABLE "user_notification_preferences" DROP COLUMN IF EXISTS "pushNotifications";
ALTER TABLE "user_notification_preferences" DROP COLUMN IF EXISTS "competitionUpdates";
ALTER TABLE "user_notification_preferences" DROP COLUMN IF EXISTS "messageNotifications";

-- Add Firebase fields to site_settings table with snake_case names
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_api_key" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_auth_domain" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_project_id" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_storage_bucket" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_messaging_sender_id" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_app_id" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebase_measurement_id" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "push_notifications_enabled" BOOLEAN DEFAULT false;

-- Add push notification fields to user_notification_preferences table with snake_case names
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "push_notifications" BOOLEAN DEFAULT true;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "competition_updates" BOOLEAN DEFAULT true;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "message_notifications" BOOLEAN DEFAULT true;
