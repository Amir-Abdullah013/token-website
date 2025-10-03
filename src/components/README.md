# Design System Components

A comprehensive design system built with Tailwind CSS for the TokenApp project.

## 🎨 Design Tokens

### Colors
- **Primary**: Indigo/Blue theme (`primary-50` to `primary-900`)
- **Secondary**: Gray theme (`secondary-50` to `secondary-900`)
- **Success**: Green theme (`success-50` to `success-900`)
- **Warning**: Yellow theme (`warning-50` to `warning-900`)
- **Error**: Red theme (`error-50` to `error-900`)

### Typography
- **Font Family**: Geist Sans (primary), Geist Mono (monospace)
- **Sizes**: xs, sm, md, lg, xl
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## 🧩 Components

### Button
```jsx
import { Button } from '../components';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

### Input
```jsx
import { Input } from '../components';

// Basic input
<Input 
  label="Email" 
  type="email" 
  placeholder="Enter your email"
  helperText="We'll never share your email"
/>

// With validation
<Input 
  label="Password" 
  type="password"
  error="Password is required"
  required
/>

// With icons
<Input 
  label="Search"
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
/>

// Success state
<Input 
  label="Email"
  value="user@example.com"
  success="Email is valid"
/>
```

### Card
```jsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Card variants
<Card variant="primary">Primary Card</Card>
<Card variant="success">Success Card</Card>
<Card variant="warning">Warning Card</Card>
<Card variant="error">Error Card</Card>
<Card hover>Hoverable Card</Card>
```

### Loader
```jsx
import { Loader, SkeletonLoader, CardSkeleton, TableSkeleton } from '../components';

// Spinner loaders
<Loader size="md" color="primary" />
<Loader variant="dots" text="Loading..." />
<Loader variant="pulse" text="Processing..." />

// Skeleton loaders
<SkeletonLoader lines={3} />
<CardSkeleton />
<TableSkeleton rows={5} columns={4} />

// Full screen loader
<Loader fullScreen text="Loading application..." />
```

### Modal
```jsx
import { Modal, ConfirmModal, AlertModal } from '../components';

// Basic modal
<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content</p>
</Modal>

// Confirmation modal
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={() => handleConfirm()}
  title="Delete Item"
  message="Are you sure?"
  variant="danger"
/>

// Alert modal
<AlertModal
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="Success!"
  message="Action completed"
  type="success"
/>
```

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Mobile**: Single column layouts, touch-friendly sizing
- **Tablet**: Two-column layouts, medium spacing
- **Desktop**: Multi-column layouts, optimal spacing

### Grid System
```jsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>

// Flex layouts
<div className="flex flex-col sm:flex-row gap-4">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

## 🎯 Best Practices

### Component Composition
```jsx
// Use sub-components for better composition
<Card>
  <CardHeader>
    <CardTitle>Dashboard</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Input label="Name" />
      <Input label="Email" />
    </div>
  </CardContent>
  <CardFooter>
    <div className="flex justify-end space-x-3">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </div>
  </CardFooter>
</Card>
```

### Accessibility
- All components include proper ARIA labels
- Keyboard navigation support
- Focus management for modals
- Screen reader friendly

### Performance
- Optimized animations with CSS transforms
- Minimal re-renders with proper state management
- Lazy loading for heavy components

## 🚀 Usage Examples

### Form with Validation
```jsx
const [formData, setFormData] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});

const handleSubmit = (e) => {
  e.preventDefault();
  // Validation logic
};

return (
  <Card>
    <CardHeader>
      <CardTitle>Sign In</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          error={errors.password}
          required
        />
        <Button type="submit" fullWidth>
          Sign In
        </Button>
      </form>
    </CardContent>
  </Card>
);
```

### Dashboard Layout
```jsx
return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <Card variant="primary">
      <CardHeader>
        <CardTitle>Total Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary-600">1,234</div>
      </CardContent>
    </Card>
    
    <Card variant="success">
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-success-600">856</div>
      </CardContent>
    </Card>
    
    <Card variant="warning">
      <CardHeader>
        <CardTitle>Pending Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-warning-600">23</div>
      </CardContent>
    </Card>
  </div>
);
```

## 🎨 Customization

### Extending Components
```jsx
// Custom button with additional styling
<Button 
  variant="primary" 
  className="shadow-lg hover:shadow-xl transform hover:scale-105"
>
  Custom Button
</Button>

// Custom card with specific padding
<Card className="p-8 bg-gradient-to-r from-primary-50 to-primary-100">
  <CardContent>
    <p>Custom styled card</p>
  </CardContent>
</Card>
```

### Theme Customization
Update `tailwind.config.js` to customize colors, spacing, and other design tokens:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Your custom primary colors
        }
      }
    }
  }
}
```


