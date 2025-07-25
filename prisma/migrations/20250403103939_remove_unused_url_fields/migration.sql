/*
  Warnings:

  - You are about to drop the column `backgroundDesktop` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundMobile` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundTablet` on the `site_settings` table. All the data in the column will be lost.
  - You are about to drop the column `preloaderUrl` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "site_settings" DROP COLUMN "backgroundDesktop",
DROP COLUMN "backgroundMobile",
DROP COLUMN "backgroundTablet",
DROP COLUMN "preloaderUrl";
