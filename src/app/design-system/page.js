'use client';

import { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  Loader, 
  SkeletonLoader, 
  CardSkeleton, 
  TableSkeleton,
  Modal, 
  ConfirmModal, 
  AlertModal 
} from '../../components';

export default function DesignSystemPage() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">Design System</h1>
          <p className="text-lg text-secondary-600">A comprehensive design system built with Tailwind CSS</p>
        </div>

        {/* Buttons Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Variants</h3>
                <div className="space-y-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Sizes</h3>
                <div className="space-y-3">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">States</h3>
                <div className="space-y-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button fullWidth>Full Width</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Basic Inputs</h3>
                <Input 
                  label="Email Address" 
                  type="email" 
                  placeholder="Enter your email"
                  helperText="We'll never share your email"
                />
                <Input 
                  label="Password" 
                  type="password" 
                  placeholder="Enter your password"
                  required
                />
                <Input 
                  label="Search" 
                  placeholder="Search..."
                  leftIcon={
                    <svg className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Validation States</h3>
                <Input 
                  label="Valid Input" 
                  value="Valid value"
                  success="This field is valid"
                />
                <Input 
                  label="Invalid Input" 
                  value={inputValue}
                  onChange={handleInputChange}
                  error={inputError}
                />
                <Input 
                  label="Filled Variant" 
                  variant="filled"
                  placeholder="Filled input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="default" hover>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600">This is a default card with hover effect.</p>
                </CardContent>
              </Card>
              
              <Card variant="primary">
                <CardHeader>
                  <CardTitle>Primary Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600">This is a primary themed card.</p>
                </CardContent>
              </Card>
              
              <Card variant="success">
                <CardHeader>
                  <CardTitle>Success Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600">This is a success themed card.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Loaders Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loaders & Skeletons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Spinners</h3>
                <div className="flex items-center space-x-4">
                  <Loader size="sm" />
                  <Loader size="md" />
                  <Loader size="lg" />
                </div>
                <div className="space-y-2">
                  <Loader variant="dots" text="Loading..." />
                  <Loader variant="pulse" text="Processing..." />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Skeleton Loaders</h3>
                <SkeletonLoader lines={3} />
                <CardSkeleton />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-secondary-900">Table Skeleton</h3>
                <TableSkeleton rows={3} columns={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modals Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Modals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowModal(true)}>
                Open Modal
              </Button>
              <Button variant="outline" onClick={() => setShowConfirmModal(true)}>
                Confirm Modal
              </Button>
              <Button variant="warning" onClick={() => setShowAlertModal(true)}>
                Alert Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary-900">Primary</h4>
                <div className="space-y-1">
                  <div className="h-8 bg-primary-500 rounded"></div>
                  <div className="h-6 bg-primary-300 rounded"></div>
                  <div className="h-4 bg-primary-100 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary-900">Secondary</h4>
                <div className="space-y-1">
                  <div className="h-8 bg-secondary-500 rounded"></div>
                  <div className="h-6 bg-secondary-300 rounded"></div>
                  <div className="h-4 bg-secondary-100 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary-900">Success</h4>
                <div className="space-y-1">
                  <div className="h-8 bg-success-500 rounded"></div>
                  <div className="h-6 bg-success-300 rounded"></div>
                  <div className="h-4 bg-success-100 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary-900">Warning</h4>
                <div className="space-y-1">
                  <div className="h-8 bg-warning-500 rounded"></div>
                  <div className="h-6 bg-warning-300 rounded"></div>
                  <div className="h-4 bg-warning-100 rounded"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary-900">Error</h4>
                <div className="space-y-1">
                  <div className="h-8 bg-error-500 rounded"></div>
                  <div className="h-6 bg-error-300 rounded"></div>
                  <div className="h-4 bg-error-100 rounded"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Example Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            This is an example modal with some content. You can put any content here.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowModal(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => console.log('Confirmed!')}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Success!"
        message="Your action has been completed successfully."
        type="success"
        buttonText="Got it"
      />
    </div>
  );
}

// Disable prerendering for this page
export const dynamic = 'force-dynamic';



