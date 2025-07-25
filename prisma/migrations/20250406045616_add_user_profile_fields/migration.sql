-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "showDob" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showFullDob" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showWhatsappNumber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappNumber" TEXT;
