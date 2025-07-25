-- Create the roles table
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Create the role_permissions table
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Add roleId to users table
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Create unique constraints
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add relation to Permission model
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_id_fkey" FOREIGN KEY ("id") REFERENCES "role_permissions"("permissionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create system roles
INSERT INTO "roles" ("id", "name", "description", "isSystem", "createdAt", "updatedAt")
VALUES 
    ('role_super_admin', 'SUPER_ADMIN', 'Full access to all features and settings', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_admin', 'ADMIN', 'Access to most administrative features', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_manager', 'MANAGER', 'Access to content management features', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_user', 'USER', 'Regular user with standard permissions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
