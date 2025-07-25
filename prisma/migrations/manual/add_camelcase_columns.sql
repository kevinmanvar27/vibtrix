-- Add camelCase columns to site_settings table
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseApiKey" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseAuthDomain" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseProjectId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseStorageBucket" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseMessagingSenderId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseAppId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "firebaseMeasurementId" TEXT;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "pushNotificationsEnabled" BOOLEAN DEFAULT false;

-- Add camelCase columns to user_notification_preferences table
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "pushNotifications" BOOLEAN DEFAULT true;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "competitionUpdates" BOOLEAN DEFAULT true;
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "messageNotifications" BOOLEAN DEFAULT true;

-- Create device_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS "device_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "deviceType" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "device_tokens_token_key" UNIQUE ("token"),
  CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on userId for faster lookups
CREATE INDEX IF NOT EXISTS "device_tokens_userId_idx" ON "device_tokens"("userId");
