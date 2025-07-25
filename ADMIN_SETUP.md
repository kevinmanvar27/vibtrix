# Admin Setup Instructions

This document provides instructions for setting up and accessing the admin area of the Vibtrix platform.

## Creating the Admin User

An admin user with the following credentials has been pre-configured:

- **Email**: rektech.uk@gmail.com
- **Username**: rektechuk
- **Password**: RekTech@27

To create this admin user, follow these steps:

1. Make sure you have installed all dependencies:
   ```
   npm install
   ```

2. Run the create-admin script:
   ```
   # Install tsx globally if you haven't already
   npm install -g tsx

   # Run the admin creation script
   tsx scripts/create-admin.ts
   ```

   Alternatively, you can use the npm script (which requires tsx to be installed globally):
   ```
   npm run create-admin
   ```

3. The script will create the admin user if it doesn't exist, or update an existing user with the same email/username to have admin privileges.

## Accessing the Admin Area

1. Navigate to `/admin-login` in your browser
2. Log in with the admin credentials:
   - Username or Email: `rektechuk` or `rektech.uk@gmail.com`
   - Password: `RekTech@27`
3. After successful login, you will be redirected to the admin dashboard at `/admin/dashboard`

## Admin Features

The admin area provides the following functionality:

- **Dashboard**: Overview of platform statistics
- **User Management**: View and manage users
- **Post Management**: Moderate posts (videos & images)
- **Competition Management**: Create and manage competitions
- **Payment Management**: Track payments and process refunds
- **Page Management**: Create and edit static pages
- **Settings**: Configure site-wide settings
- **Admin Profile**: Update admin credentials

## Changing Admin Credentials

To change the admin credentials:

1. Log in to the admin area
2. Click on "Admin Profile" in the sidebar
3. Update your username, display name, email, or password
4. Click "Save Changes"

## Security Notes

- Keep your admin credentials secure
- Change the default password after the first login
- The admin area is protected by middleware that ensures only users with admin privileges can access it
