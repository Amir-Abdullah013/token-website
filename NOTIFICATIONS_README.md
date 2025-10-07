# Notifications System

A comprehensive notifications system built with Appwrite for the Token Website project.

## Features

### User Features
- **Notifications List**: View all user-specific and global notifications
- **Notification Detail**: Full view of individual notifications
- **Mark as Read**: Mark individual notifications as read
- **Mark All as Read**: Mark all notifications as read at once
- **Real-time Bell**: Notification bell in navbar with unread count
- **Notification Dropdown**: Quick preview of recent notifications

### Admin Features
- **Notifications Management**: View all created notifications
- **Create Notifications**: Send notifications to all users or specific users
- **Notification Types**: Support for info, success, warning, and alert types
- **Statistics**: View notification statistics and counts

## Database Schema

### Notifications Collection
- `userId` (string, nullable) - User ID for personal notifications, null for global
- `title` (string) - Notification title
- `message` (string) - Notification message content
- `type` (enum) - Notification type: info, success, warning, alert
- `status` (enum) - Read status: read, unread
- `createdAt` (datetime) - Creation timestamp

## API Endpoints

### User Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Admin Endpoints
- `POST /api/notifications` - Create new notification

## Pages

### User Pages
- `/user/notifications` - User notifications list
- `/user/notifications/[id]` - Notification detail view

### Admin Pages
- `/admin/notifications` - Admin notifications management
- `/admin/notifications/create` - Create new notification

## Components

### NotificationBell
- Displays notification bell with unread count
- Shows dropdown with recent notifications
- Handles mark as read functionality

### NotificationCard
- Reusable component for displaying notifications
- Supports compact and full view modes
- Handles different notification types with appropriate styling

## Setup Instructions

1. **Database Setup**: Run the database setup to create the notifications collection
2. **Environment Variables**: Ensure Appwrite configuration is properly set
3. **Permissions**: The system automatically sets up proper permissions for users and admins

## Usage Examples

### Creating a Notification (Admin)
```javascript
import { notificationHelpers } from '@/lib/appwrite';

// Create global notification
await notificationHelpers.createNotification(
  'System Maintenance',
  'The system will be under maintenance from 2-4 AM',
  'warning'
);

// Create user-specific notification
await notificationHelpers.createNotification(
  'Welcome!',
  'Welcome to our platform!',
  'success',
  'user-id-here'
);
```

### Getting User Notifications
```javascript
import { notificationHelpers } from '@/lib/appwrite';

// Get user notifications
const notifications = await notificationHelpers.getUserNotifications(userId);

// Get unread count
const unreadCount = await notificationHelpers.getUnreadCount(userId);
```

### Marking as Read
```javascript
// Mark single notification as read
await notificationHelpers.markAsRead(notificationId);

// Mark all notifications as read
await notificationHelpers.markAllAsRead(userId);
```

## Notification Types

- **info**: General information (blue theme)
- **success**: Positive updates (green theme)
- **warning**: Important notices (yellow theme)
- **alert**: Urgent notifications (red theme)

## Security

- Users can only read their own notifications and global notifications
- Users can only update their own notifications (mark as read)
- Admins have full access to create, read, update, and delete notifications
- Proper permission rules are enforced at the database level

## Styling

The notification system uses Tailwind CSS with:
- Color-coded themes based on notification type
- Responsive design for mobile and desktop
- Hover effects and transitions
- Unread indicators with visual emphasis

## Future Enhancements

- Push notifications
- Email notifications
- Notification preferences
- Notification scheduling
- Rich text notifications
- Notification templates













