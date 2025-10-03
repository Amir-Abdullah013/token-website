'use client';

import { forwardRef } from 'react';

const Card = forwardRef(({ 
  children,
  title,
  subtitle,
  header,
  footer,
  variant = 'default',
  padding = 'md',
  className = '',
  hover = false,
  ...props 
}, ref) => {
  const baseClasses = 'bg-white rounded-lg border transition-all duration-200';
  
  const variants = {
    default: 'border-secondary-200 shadow-sm',
    elevated: 'border-secondary-200 shadow-md',
    outlined: 'border-secondary-300 shadow-none',
    filled: 'border-secondary-200 bg-secondary-50',
    primary: 'border-primary-200 bg-primary-50',
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    error: 'border-error-200 bg-error-50'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';
  
  const cardClasses = `${baseClasses} ${variants[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`;
  
  return (
    <div
      ref={ref}
      className={cardClasses}
      {...props}
    >
      {(title || subtitle || header) && (
        <div className="mb-4">
          {header && <div className="mb-2">{header}</div>}
          {title && (
            <h3 className="text-lg font-semibold text-secondary-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-secondary-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-secondary-200">
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

// Card sub-components for better composition
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-secondary-900 ${className}`} {...props}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-secondary-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`flex-1 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-secondary-200 ${className}`} {...props}>
    {children}
  </div>
);

// Export all components
export default Card;
export { CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter };


