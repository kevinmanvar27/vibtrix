-- CreateTable
CREATE TABLE "user_login_activities" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "browser" TEXT,
  "operatingSystem" TEXT,
  "deviceType" TEXT,
  "deviceBrand" TEXT,
  "deviceModel" TEXT,
  "location" TEXT,
  "city" TEXT,
  "region" TEXT,
  "country" TEXT,
  "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',

  CONSTRAINT "user_login_activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_login_activities" ADD CONSTRAINT "user_login_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
