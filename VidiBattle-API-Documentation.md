# Vibtrix API Documentation

This document provides comprehensive documentation for all APIs available in the Vibtrix platform, with a focus on supporting mobile app development.

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Posts](#posts)
4. [Competitions](#competitions)
5. [Likes & Comments](#likes--comments)
6. [Messaging](#messaging)
7. [Notifications](#notifications)
8. [Settings](#settings)
9. [Media](#media)
10. [Health & Status](#health--status)

## Authentication

### Token-Based Authentication

Vibtrix uses JWT (JSON Web Token) for mobile authentication with two types of tokens:

- **Access Token**: Short-lived token (1 hour) for API access
- **Refresh Token**: Long-lived token (7 days) to obtain new access tokens

#### Generate Authentication Tokens

```
POST /api/auth/token
```

**Request Body:**

```json
{
  "username": "username",
  "password": "password"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "USER"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account does not have permission to log in

#### Refresh Access Token

```
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Missing refresh token
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Account does not have permission to log in

#### Revoke Refresh Token (Logout)

```
POST /api/auth/revoke
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Token revoked successfully"
}
```

### Using Authentication Tokens

For all authenticated API requests, include the access token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Users

### Get User Profile

```
GET /api/users/username/{username}
```

**Response:**

```json
{
  "id": "user_id",
  "username": "username",
  "displayName": "Display Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "bio": "User bio",
  "isFollowing": false,
  "isFollower": false,
  "isBlocked": false,
  "isProfilePublic": true,
  "followersCount": 10,
  "followingCount": 20,
  "postsCount": 15
}
```

### Get User Posts

```
GET /api/users/{userId}/posts?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "posts": [
    {
      "id": "post_id",
      "content": "Post content",
      "mediaUrl": "https://example.com/media.jpg",
      "mediaType": "IMAGE",
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "_count": {
        "likes": 10,
        "comments": 5
      },
      "isLiked": false
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Follow User

```
POST /api/users/{userId}/follow
```

**Response:**

```json
{
  "success": true
}
```

### Unfollow User

```
DELETE /api/users/{userId}/follow
```

**Response:**

```json
{
  "success": true
}
```

### Block User

```
POST /api/users/{userId}/block
```

**Response:**

```json
{
  "success": true
}
```

### Unblock User

```
DELETE /api/users/{userId}/block
```

**Response:**

```json
{
  "success": true
}
```

### Get Privacy Settings

```
GET /api/users/privacy-settings
```

**Response:**

```json
{
  "showOnlineStatus": true,
  "isProfilePublic": true,
  "showWhatsappNumber": false,
  "showDob": true,
  "hideYear": true,
  "showUpiId": false
}
```

### Update Privacy Settings

```
PATCH /api/users/privacy-settings
```

**Request Body:**

```json
{
  "showOnlineStatus": true,
  "isProfilePublic": true,
  "showWhatsappNumber": false,
  "showDob": true,
  "hideYear": true,
  "showUpiId": false
}
```

**Response:**

```json
{
  "success": true
}
```

## Posts

### Get For You Feed

```
GET /api/posts/for-you?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "posts": [
    {
      "id": "post_id",
      "content": "Post content",
      "mediaUrl": "https://example.com/media.jpg",
      "mediaType": "IMAGE",
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "_count": {
        "likes": 10,
        "comments": 5
      },
      "isLiked": false
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Get Post Details

```
GET /api/posts/{postId}
```

**Response:**

```json
{
  "id": "post_id",
  "content": "Post content",
  "mediaUrl": "https://example.com/media.jpg",
  "mediaType": "IMAGE",
  "createdAt": "2023-01-01T00:00:00Z",
  "user": {
    "id": "user_id",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": "https://example.com/avatar.jpg"
  },
  "_count": {
    "likes": 10,
    "comments": 5
  },
  "isLiked": false,
  "comments": [
    {
      "id": "comment_id",
      "content": "Comment content",
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ]
}
```

### Create Post

```
POST /api/posts
```

**Request Body:**

```json
{
  "content": "Post content",
  "mediaUrl": "https://utfs.io/f/image.jpg",
  "mediaType": "IMAGE"
}
```

**Response:**

```json
{
  "id": "post_id",
  "content": "Post content",
  "mediaUrl": "https://utfs.io/f/image.jpg",
  "mediaType": "IMAGE",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Record Post View

```
POST /api/posts/{postId}/view
```

**Response:**

```json
{
  "success": true
}
```

## Likes & Comments

### Like a Post

```
POST /api/posts/{postId}/likes
```

**Response:**

```json
{
  "success": true
}
```

### Unlike a Post

```
DELETE /api/posts/{postId}/likes
```

**Response:**

```json
{
  "success": true
}
```

### Get Post Comments

```
GET /api/posts/{postId}/comments?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "Comment content",
      "createdAt": "2023-01-01T00:00:00Z",
      "user": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Add Comment to Post

```
POST /api/posts/{postId}/comments
```

**Request Body:**

```json
{
  "content": "Comment content"
}
```

**Response:**

```json
{
  "id": "comment_id",
  "content": "Comment content",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

## Competitions

### Get Active Competitions

```
GET /api/competitions?status=active&cursor={cursor}
```

**Query Parameters:**

- `status`: Filter by competition status (active, upcoming, past, all)
- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "competitions": [
    {
      "id": "competition_id",
      "title": "Competition Title",
      "description": "Competition description",
      "bannerUrl": "https://example.com/banner.jpg",
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-31T23:59:59Z",
      "status": "ACTIVE",
      "mediaType": "IMAGE",
      "isPaid": true,
      "entryFee": 100,
      "currency": "INR",
      "currentRound": {
        "id": "round_id",
        "roundNumber": 1,
        "startDate": "2023-01-01T00:00:00Z",
        "endDate": "2023-01-15T23:59:59Z",
        "status": "ACTIVE"
      },
      "_count": {
        "participants": 50
      },
      "isParticipating": false
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Get Competition Details

```
GET /api/competitions/{competitionId}
```

**Response:**

```json
{
  "id": "competition_id",
  "title": "Competition Title",
  "description": "Competition description",
  "bannerUrl": "https://example.com/banner.jpg",
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2023-01-31T23:59:59Z",
  "status": "ACTIVE",
  "mediaType": "IMAGE",
  "isPaid": true,
  "entryFee": 100,
  "currency": "INR",
  "rounds": [
    {
      "id": "round_id",
      "roundNumber": 1,
      "startDate": "2023-01-01T00:00:00Z",
      "endDate": "2023-01-15T23:59:59Z",
      "status": "ACTIVE",
      "minLikesRequired": 2
    }
  ],
  "DefaultStickers": [
    {
      "id": "sticker_id",
      "url": "https://example.com/sticker.png",
      "position": "TOP_LEFT"
    }
  ],
  "OptionalStickers": [
    {
      "id": "sticker_id",
      "url": "https://example.com/sticker.png",
      "position": "BOTTOM_RIGHT"
    }
  ],
  "participants": [
    {
      "id": "participant_id",
      "userId": "user_id",
      "status": "ACTIVE",
      "user": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      }
    }
  ],
  "_count": {
    "participants": 50
  }
}
```

### Join Competition

```
POST /api/competitions/{competitionId}/join
```

**Response:**

```json
{
  "success": true,
  "participant": {
    "id": "participant_id",
    "status": "ACTIVE",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

### Submit Competition Entry

```
POST /api/competitions/{competitionId}/submit
```

**Request Body:**

```json
{
  "mediaUrl": "https://utfs.io/f/image.jpg",
  "content": "Entry caption",
  "roundId": "round_id",
  "stickerIds": ["sticker_id_1", "sticker_id_2"]
}
```

**Response:**

```json
{
  "success": true,
  "entry": {
    "id": "entry_id",
    "postId": "post_id",
    "roundId": "round_id",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

## Messaging

### Get User Chats

```
GET /api/chats?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "chats": [
    {
      "id": "chat_id",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-02T00:00:00Z",
      "lastMessage": {
        "id": "message_id",
        "content": "Message content",
        "createdAt": "2023-01-02T00:00:00Z",
        "senderId": "user_id"
      },
      "participants": [
        {
          "id": "user_id",
          "username": "username",
          "displayName": "Display Name",
          "avatarUrl": "https://example.com/avatar.jpg",
          "onlineStatus": "ONLINE"
        }
      ],
      "unreadCount": 2
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Get Chat Messages

```
GET /api/chats/{chatId}/messages?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "messages": [
    {
      "id": "message_id",
      "content": "Message content",
      "createdAt": "2023-01-01T00:00:00Z",
      "sender": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "isRead": true,
      "attachments": [
        {
          "id": "attachment_id",
          "url": "https://utfs.io/f/attachment.jpg",
          "type": "IMAGE"
        }
      ]
    }
  ],
  "nextCursor": "next_cursor_token"
}
```

### Send Message

```
POST /api/chats/{chatId}/messages
```

**Request Body:**

```json
{
  "content": "Message content",
  "attachments": [
    {
      "url": "https://utfs.io/f/attachment.jpg",
      "type": "IMAGE"
    }
  ]
}
```

**Response:**

```json
{
  "id": "message_id",
  "content": "Message content",
  "createdAt": "2023-01-01T00:00:00Z",
  "attachments": [
    {
      "id": "attachment_id",
      "url": "https://utfs.io/f/attachment.jpg",
      "type": "IMAGE"
    }
  ]
}
```

### Create New Chat

```
POST /api/messages
```

**Request Body:**

```json
{
  "recipientId": "user_id",
  "content": "Initial message content",
  "attachments": []
}
```

**Response:**

```json
{
  "chatId": "chat_id",
  "message": {
    "id": "message_id",
    "content": "Initial message content",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}
```

## Notifications

### Get Notifications

```
GET /api/notifications?cursor={cursor}
```

**Query Parameters:**

- `cursor` (optional): Pagination cursor for fetching next page

**Response:**

```json
{
  "notifications": [
    {
      "id": "notification_id",
      "type": "LIKE",
      "message": "User liked your post",
      "createdAt": "2023-01-01T00:00:00Z",
      "isRead": false,
      "actor": {
        "id": "user_id",
        "username": "username",
        "displayName": "Display Name",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "post": {
        "id": "post_id",
        "mediaUrl": "https://example.com/media.jpg",
        "mediaType": "IMAGE"
      }
    }
  ],
  "nextCursor": "next_cursor_token",
  "unreadCount": 5
}
```

### Mark Notification as Read

```
PATCH /api/notifications/{notificationId}/read
```

**Response:**

```json
{
  "success": true
}
```

### Register Device for Push Notifications

```
POST /api/notifications/devices
```

**Request Body:**

```json
{
  "token": "firebase-device-token",
  "deviceType": "ANDROID" // or "IOS", "WEB"
}
```

**Response:**

```json
{
  "id": "device_token_id",
  "token": "firebase-device-token",
  "deviceType": "ANDROID",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Get Registered Devices

```
GET /api/notifications/devices
```

**Response:**

```json
{
  "deviceTokens": [
    {
      "id": "device_token_id",
      "token": "firebase-device-token",
      "deviceType": "ANDROID",
      "lastUsed": "2023-01-01T00:00:00Z",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ]
}
```

## Settings

### Get Feature Settings

```
GET /api/settings
```

**Response:**

```json
{
  "firebaseEnabled": true,
  "pushNotificationsEnabled": true,
  "likesEnabled": true,
  "commentsEnabled": true,
  "sharingEnabled": true,
  "messagingEnabled": true,
  "userBlockingEnabled": true,
  "loginActivityTrackingEnabled": true,
  "viewsEnabled": true,
  "bookmarksEnabled": true,
  "advertisementsEnabled": true,
  "reportingEnabled": true
}
```

## Media

### Upload Media

Vibtrix uses UploadThing for file storage. For mobile apps, you can use the custom upload endpoint:

```
POST /api/upload/custom
```

**Request Body (multipart/form-data):**

- `file`: The file to upload
- `uploadType`: Type of upload (avatar, attachment, sticker)

**Response:**

```json
{
  "url": "https://utfs.io/f/uploaded-file.jpg",
  "type": "IMAGE",
  "size": 1024000
}
```

## Health & Status

### API Health Check

```
GET /api
```

**Response:**

```json
{
  "status": "ok",
  "message": "API is working",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### Detailed Health Check

```
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "database": {
    "status": "connected",
    "latency": "5ms"
  },
  "system": {
    "uptime": 86400,
    "memory": {
      "used": "512MB",
      "total": "2GB"
    }
  },
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## Best Practices for Mobile Integration

### Authentication Flow

1. **Login**: Call `/api/auth/token` with username and password to get access and refresh tokens
2. **Token Storage**: Securely store tokens on the device (use secure storage options)
3. **API Requests**: Include the access token in the Authorization header for all authenticated requests
4. **Token Refresh**: When access token expires, use the refresh token to get a new one via `/api/auth/refresh`
5. **Logout**: Call `/api/auth/revoke` to invalidate the refresh token

### Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses follow this format:

```json
{
  "error": "Error message"
}
```

### Pagination

Most list endpoints support cursor-based pagination:

1. Initial request is made without a cursor
2. Response includes a `nextCursor` field if more items are available
3. To fetch the next page, include the `nextCursor` value in the next request
4. When `nextCursor` is null or not present, you've reached the end of the list

### Push Notifications

For push notifications in mobile apps:

1. Set up Firebase Cloud Messaging in your mobile app
2. Register the device token with `/api/notifications/devices`
3. Handle incoming notifications in your app

### Media Uploads

For media uploads:

1. Use the `/api/upload/custom` endpoint for direct uploads
2. Support adaptive quality based on network conditions
3. Implement proper error handling and retry logic for uploads

### Offline Support

For better user experience:

1. Cache frequently accessed data locally
2. Implement optimistic updates for actions like likes and comments
3. Queue actions performed while offline to sync when connection is restored
4. Display appropriate UI indicators for offline state
