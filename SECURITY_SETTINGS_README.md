# Security Settings System

A comprehensive security settings system for the Token Website project, providing users with advanced account security features.

## Features

### 🔐 Two-Factor Authentication (2FA)
- **Toggle 2FA**: Enable/disable two-factor authentication
- **Dummy Implementation**: Uses a simple OTP code (123456) for demo purposes
- **Visual Feedback**: Clear status indicators and setup flow
- **Local Storage**: Persists 2FA status across sessions

### 🔒 Password Management
- **Change Password**: Secure password change with current password verification
- **Validation**: Minimum 8 character requirement
- **Confirmation**: New password confirmation field
- **Error Handling**: Clear error messages for failed attempts

### 📱 Active Sessions Management
- **Session Display**: View all active sessions across devices
- **Device Detection**: Automatic device type detection from user agent
- **Current Session**: Highlight the current active session
- **Session Details**: Last active time and device information
- **Logout All**: End all sessions from all devices
- **Individual Logout**: End specific sessions (except current)

### 🎨 User Interface
- **Tabbed Interface**: Clean tab navigation between Profile and Security
- **Security Overview**: Visual security status dashboard
- **Responsive Design**: Works on mobile and desktop
- **Status Indicators**: Color-coded security status indicators

## Pages

### User Profile Page (`/user/profile`)
- **Tab Navigation**: Switch between Profile Information and Security Settings
- **URL Parameters**: Support for `?tab=security` parameter
- **Security Overview**: Quick access to security features
- **Profile Information**: Standard profile management

### Security Settings Page (`/user/security`)
- **2FA Management**: Enable/disable two-factor authentication
- **Password Change**: Secure password update form
- **Session Management**: View and manage active sessions
- **Logout All**: End all sessions with confirmation

### Test Page (`/test-security`)
- **Feature Testing**: Test all security features
- **Session Display**: View current active sessions
- **Quick Actions**: Direct links to security features

## API Integration

### Appwrite Functions
- `authHelpers.getActiveSessions()` - Get all active sessions
- `authHelpers.logoutAllSessions()` - End all sessions
- `authHelpers.deleteSession(sessionId)` - End specific session
- `authHelpers.changePassword(current, new)` - Change password

### Session Information
- **Device Detection**: Automatic device type identification
- **User Agent Parsing**: Extract device information
- **Last Active**: Session expiration time
- **Current Session**: Identify active session

## Security Features

### Two-Factor Authentication
```javascript
// Enable 2FA (dummy implementation)
const twoFactorCode = '123456'; // Demo code
if (twoFactorCode === '123456') {
  setTwoFactorEnabled(true);
  localStorage.setItem('twoFactorEnabled', 'true');
}
```

### Password Change
```javascript
// Change password with validation
await authHelpers.changePassword(currentPassword, newPassword);
```

### Session Management
```javascript
// Get active sessions
const sessions = await authHelpers.getActiveSessions();

// Logout all sessions
await authHelpers.logoutAllSessions();

// Delete specific session
await authHelpers.deleteSession(sessionId);
```

## UI Components

### Security Settings Card
- **2FA Toggle**: Enable/disable with status indicator
- **Password Form**: Current and new password fields
- **Session List**: Active sessions with device info
- **Action Buttons**: Logout all sessions button

### Profile Tab Integration
- **Tab Navigation**: Clean tab switching
- **Security Overview**: Visual security dashboard
- **Quick Access**: Direct link to security settings

## Device Detection

The system automatically detects device types from user agent strings:

- **Mobile**: 📱 Mobile device
- **Tablet**: 📱 Tablet device  
- **Windows**: 💻 Windows device
- **Mac**: 💻 Mac device
- **Linux**: 💻 Linux device
- **Unknown**: 💻 Unknown device

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- Current password verification
- New password confirmation
- Clear error messages

### Session Management
- Display all active sessions
- Highlight current session
- Allow logout from all devices
- Individual session termination

### 2FA Implementation
- Simple toggle interface
- Clear setup instructions
- Status persistence
- Demo implementation ready for real 2FA

## Testing

### Test Page Features
- **User Information**: Display current user data
- **Active Sessions**: Show all active sessions
- **Quick Actions**: Direct links to security features
- **Feature List**: Comprehensive feature overview

### Manual Testing
1. Visit `/test-security` to see current sessions
2. Navigate to `/user/profile?tab=security` for security overview
3. Go to `/user/security` for full security settings
4. Test 2FA toggle with code `123456`
5. Try changing password
6. Test logout all sessions

## Future Enhancements

### Real 2FA Implementation
- QR code generation for authenticator apps
- TOTP (Time-based One-Time Password) support
- Backup codes generation
- Recovery options

### Advanced Security
- Login attempt monitoring
- Suspicious activity alerts
- IP address tracking
- Geographic location monitoring

### Additional Features
- Security notifications
- Password strength meter
- Security score dashboard
- Audit logs

## File Structure

```
src/
├── app/
│   ├── user/
│   │   ├── profile/page.js          # Profile page with tabs
│   │   └── security/page.js         # Security settings page
│   └── test-security/page.js        # Test page
├── lib/
│   └── appwrite.js                  # Security helper functions
└── components/
    └── (existing components)
```

## Usage Examples

### Enable 2FA
```javascript
// User clicks enable 2FA
setShowTwoFactorSetup(true);

// User enters verification code
if (twoFactorCode === '123456') {
  setTwoFactorEnabled(true);
  localStorage.setItem('twoFactorEnabled', 'true');
}
```

### Change Password
```javascript
// Validate passwords match
if (newPassword !== confirmPassword) {
  setToast({ type: 'error', message: 'Passwords do not match' });
  return;
}

// Change password
await authHelpers.changePassword(currentPassword, newPassword);
```

### Manage Sessions
```javascript
// Get all active sessions
const sessions = await authHelpers.getActiveSessions();

// Logout from all devices
await authHelpers.logoutAllSessions();

// End specific session
await authHelpers.deleteSession(sessionId);
```

The security settings system provides a comprehensive solution for user account security with an intuitive interface and robust functionality.










