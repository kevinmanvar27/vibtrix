# Admin User Management

This document explains how the admin user is managed in the Vibtrix application.

## Default Admin Credentials

The default admin credentials are:

- **Username/Email**: admin@rektech.uk
- **Password**: RekTech@27
- **Role**: SUPER_ADMIN

## Automatic Admin User Creation

The application automatically checks for the existence of the admin user during startup. If the admin user doesn't exist, it will be created automatically with the default credentials.

This functionality is implemented in:
- `src/lib/ensure-admin-user.ts` - Contains the logic to check and create the admin user
- `src/app/layout.tsx` - Calls the `ensureAdminUser()` function during application startup

## Manual Admin User Creation

If you need to manually create or update the admin user, you can use the following scripts:

### Check Admin User

```bash
cd /path/to/project/nextjs
node scripts/check-admin.js
```

This script will check if the admin user exists and display its details.

### Create/Update Admin User

```bash
cd /path/to/project/nextjs
node scripts/create-admin-user.js
```

This script will create the admin user if it doesn't exist, or update it if it already exists.

## Troubleshooting Admin Login Issues

If you encounter issues with admin login:

1. Check if the admin user exists in the database using the check-admin.js script
2. If the admin user doesn't exist, run the create-admin-user.js script
3. Try logging in with the default credentials
4. If login still fails, check the server logs for any errors

## Changing Admin Credentials

To change the admin credentials, you can modify the `scripts/create-admin-user.js` script and run it. This will update the admin user with the new credentials.

Alternatively, you can use the admin interface to update the admin user's credentials once you're logged in.

## Security Considerations

- Change the default admin password after the first login
- Use a strong password for the admin account
- Consider implementing two-factor authentication for admin accounts in the future
- Regularly audit admin account access and activities
