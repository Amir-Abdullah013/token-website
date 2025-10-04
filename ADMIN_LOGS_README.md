# Admin Logs System

A comprehensive admin activity logging system for the Token Website project, ensuring transparency and auditability of all admin actions.

## Features

### 📋 Admin Activity Logging
- **Automatic Logging**: All admin actions are automatically logged
- **Detailed Information**: Captures admin ID, action, target, details, IP, and timestamp
- **Real-time Updates**: Logs are created immediately when actions occur
- **Comprehensive Coverage**: Logs all admin operations across the system

### 🔍 Search and Filter
- **Search Functionality**: Search by action, admin ID, or details
- **Admin Filter**: Filter logs by specific admin user
- **Real-time Search**: Instant search results as you type
- **Clear Filters**: Easy reset of all search and filter criteria

### 📊 Statistics Dashboard
- **Total Actions**: Count of all admin actions
- **Recent Activity**: Actions in the last 24 hours
- **Active Admins**: Number of unique admins who performed actions
- **Visual Indicators**: Color-coded statistics cards

### 🎨 User Interface
- **Clean Design**: Modern, responsive interface
- **Action Icons**: Visual indicators for different action types
- **Color Coding**: Different colors for different action types
- **Responsive Layout**: Works on all device sizes

## Database Schema

### AdminLogs Collection
- `adminId` (string) - ID of the admin who performed the action
- `action` (string) - Description of the action performed
- `targetType` (string) - Type of target (e.g., 'transaction', 'user', 'notification')
- `targetId` (string) - ID of the target object
- `details` (string) - Additional details about the action
- `ipAddress` (string) - IP address of the admin
- `userAgent` (string) - User agent string
- `createdAt` (datetime) - Timestamp of the action

## API Functions

### Core Functions
```javascript
// Log admin action
await adminHelpers.logAdminAction(adminId, action, targetType, targetId, details);

// Get all admin logs
const logs = await adminHelpers.getAdminLogs(limit, offset);

// Search admin logs
const results = await adminHelpers.searchAdminLogs(searchTerm, limit, offset);

// Get logs by specific admin
const adminLogs = await adminHelpers.getAdminLogsByAdmin(adminId, limit, offset);

// Get log statistics
const stats = await adminHelpers.getAdminLogStats();
```

### Search and Filter
```javascript
// Search by action, admin ID, or details
const searchResults = await adminHelpers.searchAdminLogs('approve', 50, 0);

// Filter by specific admin
const adminLogs = await adminHelpers.getAdminLogsByAdmin('admin123', 50, 0);

// Get statistics
const stats = await adminHelpers.getAdminLogStats();
```

## Pages

### Admin Logs Page (`/admin/logs`)
- **Full Log View**: Complete list of all admin activities
- **Search Interface**: Search by action, admin ID, or details
- **Admin Filter**: Dropdown to filter by specific admin
- **Statistics Cards**: Overview of admin activity
- **Export Options**: CSV and PDF export (placeholder)

### Test Page (`/test-admin-logs`)
- **Test Log Creation**: Create sample admin logs
- **Quick Actions**: Direct links to admin logs page
- **Statistics Display**: Real-time statistics
- **Feature Overview**: Comprehensive feature list

## Action Types and Icons

### Visual Indicators
- **✅ Approve**: Green checkmark for approval actions
- **❌ Reject**: Red X for rejection actions
- **➕ Create**: Blue plus for creation actions
- **✏️ Update**: Yellow pencil for update actions
- **🗑️ Delete**: Red trash for deletion actions
- **🔐 Login**: Green lock for login actions
- **🚪 Logout**: Gray door for logout actions
- **📝 General**: Gray note for other actions

### Color Coding
- **Green**: Approve, Login actions
- **Red**: Reject, Delete actions
- **Blue**: Create actions
- **Yellow**: Update actions
- **Gray**: Logout, General actions

## Security and Permissions

### Access Control
- **Admin Only**: Only admin users can view logs
- **Full Access**: Admins can view all logs
- **Search Permissions**: Admins can search and filter logs
- **Export Permissions**: Admins can export log data

### Data Protection
- **Audit Trail**: Complete audit trail of all admin actions
- **IP Tracking**: IP addresses are logged for security
- **User Agent**: Browser information is captured
- **Timestamp**: Precise timestamps for all actions

## Usage Examples

### Logging Admin Actions
```javascript
// Log transaction approval
await adminHelpers.logAdminAction(
  adminId,
  'Approved withdrawal of 500 PKR for user X',
  'transaction',
  transactionId,
  'Manual approval after verification'
);

// Log user creation
await adminHelpers.logAdminAction(
  adminId,
  'Created new user account',
  'user',
  userId,
  'User registered via admin panel'
);

// Log system settings change
await adminHelpers.logAdminAction(
  adminId,
  'Updated system settings',
  'settings',
  'global',
  'Changed maintenance mode status'
);
```

### Searching and Filtering
```javascript
// Search for specific actions
const approvalLogs = await adminHelpers.searchAdminLogs('approve', 50, 0);

// Filter by specific admin
const adminLogs = await adminHelpers.getAdminLogsByAdmin('admin123', 50, 0);

// Get recent activity
const recentLogs = await adminHelpers.getAdminLogs(50, 0);
```

## Integration Points

### Automatic Logging
The system automatically logs admin actions in these areas:
- **Transaction Management**: Approve/reject transactions
- **User Management**: Create/update/delete users
- **Notification System**: Create/delete notifications
- **System Settings**: Update configuration
- **Authentication**: Login/logout events

### Manual Logging
Admins can manually log actions:
```javascript
// Log custom action
await adminHelpers.logAdminAction(
  adminId,
  'Custom action description',
  'custom',
  'target-id',
  'Additional details'
);
```

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── logs/
│   │       └── page.js          # Admin logs list page
│   └── test-admin-logs/
│       └── page.js              # Test page
├── lib/
│   └── appwrite.js              # Admin log helper functions
└── components/
    └── (existing components)
```

## Testing

### Test Page Features
- **Create Test Logs**: Generate sample admin logs
- **View Statistics**: Real-time statistics display
- **Quick Navigation**: Direct links to admin logs
- **Feature Overview**: Complete feature documentation

### Manual Testing
1. Visit `/test-admin-logs` to create test logs
2. Go to `/admin/logs` to view the full interface
3. Test search functionality with different terms
4. Test filter by admin functionality
5. Verify statistics updates in real-time
6. Check log details and timestamps

## Future Enhancements

### Advanced Features
- **Log Retention**: Automatic cleanup of old logs
- **Advanced Filtering**: Date range, action type filters
- **Real-time Updates**: WebSocket integration for live updates
- **Bulk Operations**: Bulk export and management
- **Log Analytics**: Advanced analytics and reporting

### Security Enhancements
- **Log Encryption**: Encrypt sensitive log data
- **Access Logging**: Log who accessed the logs
- **Audit Reports**: Generate audit reports
- **Compliance**: GDPR and compliance features

## Best Practices

### Logging Guidelines
- **Descriptive Actions**: Use clear, descriptive action messages
- **Consistent Format**: Maintain consistent logging format
- **Include Context**: Provide relevant context in details
- **Regular Review**: Regularly review and audit logs

### Performance Considerations
- **Pagination**: Use pagination for large log sets
- **Indexing**: Proper database indexing for fast searches
- **Caching**: Cache frequently accessed log data
- **Cleanup**: Regular cleanup of old log data

The Admin Logs system provides comprehensive audit capabilities with an intuitive interface, ensuring complete transparency of all admin activities while maintaining security and performance.










