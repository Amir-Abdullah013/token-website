# Dashboard Layouts

This document describes the dashboard layouts for both user and admin interfaces, featuring responsive design, sidebar navigation, and comprehensive content areas.

## User Dashboard (`/user/dashboard`)

### Features
- **Sidebar Navigation**: Dashboard, Deposit, Withdraw, Buy/Sell, Transactions, Profile
- **Wallet Overview**: Total balance, available/pending amounts, quick actions
- **Quick Stats**: Portfolio value, deposits, withdrawals, active trades
- **Recent Transactions**: Transaction history with status indicators
- **Quick Actions**: Direct links to deposit, withdraw, and trade functions

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Top Navbar (with user menu and sign out)                │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────┐ │
│ │ Sidebar │ │ Main Content Area                        │ │
│ │         │ │ ┌─────────────────────────────────────┐ │ │
│ │ • 📊    │ │ │ Quick Stats (4 cards)               │ │ │
│ │ • 💰    │ │ └─────────────────────────────────────┘ │ │
│ │ • 💸    │ │ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ • 🔄    │ │ │ Wallet Overview │ │ Recent Trans.   │ │ │
│ │ • 📋    │ │ │ (2 columns)     │ │ Quick Actions   │ │ │
│ │ • 👤    │ │ └─────────────────┘ └─────────────────┘ │ │
│ └─────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Components Used
- `WalletOverview`: Main wallet display with balance and actions
- `QuickStats`: Portfolio metrics and performance indicators
- `Card`: Reusable card components for content organization

## Admin Dashboard (`/admin/dashboard`)

### Features
- **Sidebar Navigation**: Dashboard, Users, Wallets, Deposits, Withdrawals, Transactions
- **Admin Stats**: System-wide metrics and KPIs
- **User Management**: User statistics and management tools
- **Transaction Overview**: Deposit/withdrawal analytics
- **System Status**: API, database, and backup status
- **Quick Actions**: Direct access to admin functions
- **Recent Activity**: System activity feed

### Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ Top Navbar (with admin menu and sign out)               │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────┐ │
│ │ Sidebar │ │ Main Content Area                        │ │
│ │         │ │ ┌─────────────────────────────────────┐ │ │
│ │ • 📊    │ │ │ Admin Stats (6 cards)              │ │ │
│ │ • 👥    │ │ └─────────────────────────────────────┘ │ │
│ │ • 💼    │ │ ┌─────────────────┐ ┌─────────────────┐ │ │
│ │ • 💰    │ │ │ User Management │ │ System Status    │ │ │
│ │ • 💸    │ │ │ Transaction     │ │ Quick Actions   │ │ │
│ │ • 📋    │ │ │ Overview        │ │ Recent Activity  │ │ │
│ └─────────┘ └─────────────────┘ └─────────────────┘ │ │
└─────────────────────────────────────────────────────────┘
```

### Components Used
- `AdminStats`: System-wide statistics and metrics
- `Card`: Content organization and layout
- `Button`: Action buttons and navigation

## Responsive Design

### Mobile (< 1024px)
- **Sidebar**: Hidden by default, accessible via floating action button
- **Layout**: Single column layout with full-width cards
- **Navigation**: Collapsible mobile menu in navbar
- **Content**: Stacked vertically for optimal mobile viewing

### Desktop (≥ 1024px)
- **Sidebar**: Always visible, fixed width (256px)
- **Layout**: Two-column layout with main content and sidebar
- **Navigation**: Full sidebar navigation with icons
- **Content**: Optimized grid layouts for larger screens

## Sidebar Navigation

### User Navigation
```javascript
const userNavigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: '📊' },
  { name: 'Deposit', href: '/user/deposit', icon: '💰' },
  { name: 'Withdraw', href: '/user/withdraw', icon: '💸' },
  { name: 'Buy/Sell', href: '/user/trade', icon: '🔄' },
  { name: 'Transactions', href: '/user/transactions', icon: '📋' },
  { name: 'Profile', href: '/user/profile', icon: '👤' },
];
```

### Admin Navigation
```javascript
const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Wallets', href: '/admin/wallets', icon: '💼' },
  { name: 'Deposits', href: '/admin/deposits', icon: '💰' },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: '💸' },
  { name: 'Transactions', href: '/admin/transactions', icon: '📋' },
];
```

## Theme & Styling

### Design Principles
- **Minimal**: Clean, uncluttered interface
- **Light**: Light color scheme with subtle shadows
- **Consistent**: Unified design language across all components
- **Responsive**: Mobile-first approach with progressive enhancement

### Color Palette
- **Primary**: Blue (#3B82F6) for main actions
- **Success**: Green (#10B981) for positive indicators
- **Warning**: Yellow (#F59E0B) for pending states
- **Error**: Red (#EF4444) for negative indicators
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable font sizes with proper line spacing
- **Labels**: Consistent labeling for form elements and data

## Component Architecture

### Layout Components
- `Layout`: Main layout wrapper with sidebar and navbar
- `Sidebar`: Navigation sidebar with user info and links
- `Navbar`: Top navigation with user menu

### Dashboard Components
- `WalletOverview`: User wallet display and actions
- `QuickStats`: User portfolio statistics
- `AdminStats`: System-wide admin metrics

### Utility Components
- `Card`: Flexible content containers
- `Button`: Action buttons with variants
- `Loader`: Loading states and skeletons

## File Structure

```
src/
├── components/
│   ├── Layout.js              # Main layout wrapper
│   ├── Sidebar.js             # Navigation sidebar
│   ├── Navbar.js              # Top navigation
│   ├── WalletOverview.js      # User wallet component
│   ├── QuickStats.js          # User stats component
│   ├── AdminStats.js          # Admin stats component
│   └── Card.js                # Reusable card component
├── app/
│   ├── user/
│   │   └── dashboard/
│   │       └── page.js         # User dashboard
│   └── admin/
│       └── dashboard/
│           └── page.js         # Admin dashboard
```

## Usage Examples

### Basic Dashboard Layout
```jsx
import Layout from '../components/Layout';
import WalletOverview from '../components/WalletOverview';

function UserDashboard() {
  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        <WalletOverview />
      </div>
    </Layout>
  );
}
```

### Admin Dashboard with Stats
```jsx
import Layout from '../components/Layout';
import AdminStats from '../components/AdminStats';

function AdminDashboard() {
  return (
    <Layout showSidebar={true}>
      <div className="max-w-7xl mx-auto">
        <AdminStats />
      </div>
    </Layout>
  );
}
```

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live data
- **Customizable Layouts**: User-configurable dashboard layouts
- **Advanced Analytics**: Charts and graphs for data visualization
- **Notification System**: Real-time notifications and alerts
- **Theme Customization**: Dark mode and theme switching
- **Accessibility**: Enhanced accessibility features and keyboard navigation











