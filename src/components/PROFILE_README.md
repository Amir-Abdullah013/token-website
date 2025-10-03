# Profile Module

This module provides comprehensive profile management functionality for both users and administrators.

## Features

### User Profile (`/user/profile`)
- **View Profile**: Display user information (name, email, phone, account status, member since)
- **Edit Profile**: Update name and phone number
- **Change Password**: Secure password change with current password verification
- **Account Information**: View user ID, account type, last login
- **Security Status**: Email verification status and verification options

### Admin Profile (`/admin/profile`)
- **View Profile**: Display administrator information (read-only)
- **Change Password**: Secure password change functionality
- **Administrator Information**: Admin ID, role level, account details
- **Security Status**: Email verification and admin privileges status
- **Quick Actions**: Links to admin dashboard, user management, and system settings

## Components

### ProfileCard Component
A reusable component that handles profile display and editing:

```jsx
<ProfileCard
  user={userData}
  onUpdate={handleProfileUpdate}
  onPasswordChange={handlePasswordChange}
  isEditable={true}
  showPasswordChange={true}
/>
```

**Props:**
- `user`: User data object
- `onUpdate`: Function to handle profile updates
- `onPasswordChange`: Function to handle password changes
- `isEditable`: Whether the profile can be edited (default: true)
- `showPasswordChange`: Whether to show password change functionality (default: true)

## API Integration

### Appwrite Functions Used
- `account.updateName()`: Update user's display name
- `account.updatePrefs()`: Update user preferences (phone number)
- `account.updatePassword()`: Change user password
- `account.get()`: Get current user information
- `account.getPrefs()`: Get user preferences

### Profile Update Flow
1. User edits profile information
2. Name is updated via `account.updateName()`
3. Phone number is stored in user preferences via `account.updatePrefs()`
4. User data is refreshed to reflect changes

### Password Change Flow
1. User provides current password
2. User enters new password and confirmation
3. Password is updated via `account.updatePassword()`
4. Success message is displayed

## Security Features

- **Current Password Verification**: Required for password changes
- **Password Confirmation**: New password must be entered twice
- **Minimum Password Length**: 8 characters minimum
- **Email Verification Status**: Display and management of email verification
- **Role-based Access**: Different functionality for users vs admins

## Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Desktop Layout**: Enhanced layout for larger screens
- **Card-based UI**: Clean, organized information display
- **Form Validation**: Client-side validation with error messages

## Navigation Integration

- **Sidebar Navigation**: Profile links in user/admin sidebars
- **Dashboard Integration**: Quick access from dashboard cards
- **Breadcrumb Navigation**: Easy navigation back to dashboard

## Error Handling

- **Network Errors**: Graceful handling of API failures
- **Validation Errors**: Clear error messages for invalid input
- **Success Feedback**: Confirmation messages for successful operations
- **Loading States**: Visual feedback during operations

## Usage Examples

### Basic User Profile
```jsx
import ProfileCard from '../components/ProfileCard';

function UserProfile() {
  const handleUpdate = async (formData) => {
    await authHelpers.updateProfile(formData.name, formData.phone);
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await authHelpers.changePassword(currentPassword, newPassword);
  };

  return (
    <ProfileCard
      user={userData}
      onUpdate={handleUpdate}
      onPasswordChange={handlePasswordChange}
    />
  );
}
```

### Admin Profile (View Only)
```jsx
<ProfileCard
  user={adminData}
  onUpdate={null}
  onPasswordChange={handlePasswordChange}
  isEditable={false}
  showPasswordChange={true}
/>
```

## File Structure

```
src/
├── components/
│   └── ProfileCard.js          # Reusable profile component
├── app/
│   ├── user/
│   │   └── profile/
│   │       └── page.js         # User profile page
│   └── admin/
│       └── profile/
│           └── page.js         # Admin profile page
└── lib/
    └── appwrite.js            # Profile-related API functions
```

## Future Enhancements

- **Profile Picture Upload**: Avatar management
- **Two-Factor Authentication**: Enhanced security options
- **Profile Export**: Data export functionality
- **Activity History**: Profile change history
- **Bulk Profile Updates**: Admin bulk operations










