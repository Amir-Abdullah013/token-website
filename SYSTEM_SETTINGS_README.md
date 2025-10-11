# System Settings

A comprehensive system settings management system for the Token Website project, allowing admins to configure token price, supply, and payment gateways.

## Features

### 💰 Token Price Management
- **Manual Price Setting**: Admins can manually set the token price in USD
- **Validation**: Price must be greater than 0
- **Real-time Updates**: Price changes are immediately reflected
- **Admin Logging**: All price changes are logged for audit purposes

### 📊 Token Supply Management
- **Supply Configuration**: Set the total token supply for display
- **Validation**: Supply must be greater than 0
- **Formatted Display**: Supply is displayed with proper number formatting
- **Admin Logging**: All supply changes are logged

### 💳 Payment Gateway Management
- **Gateway Configuration**: Add, remove, and manage payment gateways
- **Active/Inactive Status**: Toggle gateway availability
- **Gateway Details**: Store gateway name and status
- **Admin Logging**: All gateway changes are logged

### 🔒 Security and Permissions
- **Admin-Only Access**: Only admin users can modify settings
- **Read Access**: Users can read settings for display purposes
- **Audit Trail**: All changes are logged with admin details
- **Validation**: Form validation prevents invalid data

## Database Schema

### SystemSettings Collection
- `key` (string) - Unique identifier for the setting
- `value` (string) - Setting value (stored as string)
- `description` (string) - Human-readable description
- `createdAt` (datetime) - When the setting was created
- `updatedAt` (datetime) - When the setting was last updated

### Default Settings
- `token_price`: Current token price in USD
- `token_supply`: Total token supply
- `payment_gateways`: JSON array of payment gateway objects

## API Functions

### Core Functions
```javascript
// Get system settings
const settings = await systemSettingsHelpers.getSystemSettings();

// Get specific setting
const setting = await systemSettingsHelpers.getSetting('token_price');

// Set setting
await systemSettingsHelpers.setSetting('token_price', '1.25', 'Current token price');

// Get all settings as key-value pairs
const allSettings = await systemSettingsHelpers.getAllSettings();
```

### Token Management
```javascript
// Get token price
const price = await systemSettingsHelpers.getTokenPrice();

// Set token price
await systemSettingsHelpers.setTokenPrice(1.25);

// Get token supply
const supply = await systemSettingsHelpers.getTokenSupply();

// Set token supply
await systemSettingsHelpers.setTokenSupply(2000000);
```

### Payment Gateway Management
```javascript
// Get payment gateways
const gateways = await systemSettingsHelpers.getPaymentGateways();

// Set payment gateways
const gateways = [
  { name: 'Stripe', active: true },
  { name: 'PayPal', active: true },
  { name: 'Bank Transfer', active: false }
];
await systemSettingsHelpers.setPaymentGateways(gateways);
```

### Initialization
```javascript
// Initialize default settings
await systemSettingsHelpers.initializeDefaultSettings();
```

## Pages

### System Settings Page (`/admin/settings`)
- **Token Price Form**: Update token price with validation
- **Token Supply Form**: Update token supply with validation
- **Payment Gateway Management**: Add, remove, and toggle gateways
- **Settings Overview**: Current settings display
- **Real-time Updates**: Immediate reflection of changes

### Test Page (`/test-system-settings`)
- **Test Actions**: Create sample settings updates
- **Quick Actions**: Direct links to settings page
- **Settings Display**: Current settings overview
- **Feature Documentation**: Complete feature list

## User Interface

### Form Design
- **Clean Layout**: Simple, intuitive forms
- **Validation Feedback**: Clear error messages
- **Save Buttons**: Individual save buttons for each setting
- **Loading States**: Visual feedback during operations

### Validation Rules
- **Token Price**: Must be greater than 0
- **Token Supply**: Must be greater than 0
- **Gateway Name**: Required for new gateways
- **Real-time Validation**: Immediate feedback on input

### Visual Indicators
- **Current Values**: Display current settings
- **Status Indicators**: Active/inactive gateway status
- **Success Messages**: Confirmation of successful updates
- **Error Messages**: Clear error descriptions

## Security Features

### Access Control
- **Admin-Only Modification**: Only admins can change settings
- **User Read Access**: Users can read settings for display
- **Authentication Required**: Must be logged in to access

### Audit Trail
- **Admin Action Logging**: All changes are logged
- **Change Details**: What was changed and by whom
- **Timestamp Tracking**: When changes were made
- **Admin Identification**: Which admin made the change

### Data Validation
- **Input Validation**: Server-side validation of all inputs
- **Type Checking**: Ensure correct data types
- **Range Validation**: Enforce minimum values
- **Required Fields**: Ensure all required data is provided

## Usage Examples

### Setting Token Price
```javascript
// Set token price to $1.25
await systemSettingsHelpers.setTokenPrice(1.25);

// Log admin action
await adminHelpers.logAdminAction(
  adminId,
  'Updated token price to $1.25',
  'system_settings',
  'token_price',
  'Token price changed from $1.00 to $1.25'
);
```

### Managing Payment Gateways
```javascript
// Add new gateway
const gateways = [
  { name: 'Stripe', active: true },
  { name: 'PayPal', active: true },
  { name: 'Bank Transfer', active: false }
];
await systemSettingsHelpers.setPaymentGateways(gateways);

// Log admin action
await adminHelpers.logAdminAction(
  adminId,
  'Updated payment gateways',
  'system_settings',
  'payment_gateways',
  'Added new payment gateway: Bank Transfer'
);
```

### Getting Settings
```javascript
// Get current token price
const price = await systemSettingsHelpers.getTokenPrice();

// Get all settings
const allSettings = await systemSettingsHelpers.getAllSettings();

// Get specific setting
const tokenPrice = await systemSettingsHelpers.getSetting('token_price');
```

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── settings/
│   │       └── page.js          # System settings page
│   └── test-system-settings/
│       └── page.js              # Test page
├── lib/
│   ├── appwrite.js              # System settings helper functions
│   └── database-setup.js        # SystemSettings collection setup
└── components/
    └── (existing components)
```

## Testing

### Test Page Features
- **Test Actions**: Generate sample settings updates
- **Settings Display**: Real-time settings overview
- **Quick Navigation**: Direct links to settings page
- **Feature Overview**: Complete feature documentation

### Manual Testing
1. Visit `/test-system-settings` to test functionality
2. Go to `/admin/settings` to use the full interface
3. Test form validation with invalid values
4. Test payment gateway management
5. Verify admin action logging
6. Check settings persistence

## Integration Points

### Automatic Logging
The system automatically logs admin actions when:
- Token price is updated
- Token supply is changed
- Payment gateways are modified
- Settings are initialized

### User Interface Integration
- **Dashboard Display**: Settings are used in dashboard displays
- **Price Display**: Token price is shown in user interfaces
- **Gateway Selection**: Payment gateways are used in payment forms
- **Supply Display**: Token supply is shown in statistics

## Best Practices

### Setting Management
- **Descriptive Keys**: Use clear, descriptive setting keys
- **Validation**: Always validate input data
- **Logging**: Log all setting changes
- **Backup**: Consider backing up important settings

### Performance Considerations
- **Caching**: Cache frequently accessed settings
- **Efficient Queries**: Use indexed queries for fast access
- **Batch Updates**: Group related setting updates
- **Error Handling**: Handle errors gracefully

## Future Enhancements

### Advanced Features
- **Setting Categories**: Group related settings
- **Setting Dependencies**: Settings that depend on others
- **Bulk Updates**: Update multiple settings at once
- **Setting History**: Track setting change history

### UI Improvements
- **Advanced Forms**: More sophisticated form controls
- **Setting Templates**: Predefined setting configurations
- **Import/Export**: Settings backup and restore
- **Real-time Sync**: Live updates across admin sessions

The System Settings system provides comprehensive configuration management with an intuitive interface, ensuring admins can easily manage all system parameters while maintaining security and audit capabilities.




















