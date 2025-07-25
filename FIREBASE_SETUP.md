# Firebase Setup for Vibtrix

This document explains how to set up Firebase Cloud Messaging (FCM) for push notifications in Vibtrix.

## Prerequisites

1. A Google account
2. A Firebase project (create one at https://console.firebase.google.com/)

## Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add a web app to your project by clicking the web icon (`</>`)
4. Register your app with a nickname (e.g., "Vibtrix Web")
5. Copy the Firebase configuration object for later use

## Firebase Admin SDK Setup

1. In the Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key" to download a JSON file with your credentials
3. Store this file securely - it contains sensitive information

## Environment Variables Setup

Add the following variables to your `.env` file:

```
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

## Generate VAPID Key

To enable web push notifications, you need to generate a VAPID key:

1. In the Firebase Console, go to Project Settings > Cloud Messaging
2. In the Web configuration section, click "Generate key pair"
3. Copy the generated key to your environment variables as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## Admin Panel Configuration

Alternatively, you can configure Firebase through the admin panel:

1. Log in to the Vibtrix admin panel
2. Go to Settings > Firebase
3. Enable Firebase and fill in the configuration details
4. Enable Push Notifications
5. Save the settings

## Testing Push Notifications

To test push notifications:

1. Make sure you've enabled notifications in your browser
2. Log in to Vibtrix
3. Perform an action that triggers a notification (like receiving a like or comment)
4. You should receive a push notification

## Mobile App Integration

For mobile app integration:

1. Add Firebase to your mobile app following the Firebase documentation
2. Use the same Firebase project as your web app
3. Implement the device token registration API to register mobile devices

## Troubleshooting

If push notifications aren't working:

1. Check that Firebase is enabled in the admin settings
2. Verify that push notifications are enabled in the admin settings
3. Make sure the user has granted notification permissions in their browser
4. Check the browser console for any errors
5. Verify that the service worker is registered correctly

## Security Considerations

- Keep your Firebase Admin SDK private key secure
- Don't commit sensitive credentials to version control
- Use environment variables for all sensitive information
- Consider using Firebase Authentication Rules to secure your data
