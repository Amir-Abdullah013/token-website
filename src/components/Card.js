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
  glow = false,
  ...props 
}, ref) => {
  const baseClasses = 'rounded-lg border transition-all duration-200';
  
  const variants = {
    default: 'bg-black/20 backdrop-blur-md border-white/10 shadow-sm',
    elevated: 'bg-black/20 backdrop-blur-md border-white/10 shadow-lg',
    filled: 'bg-white/5 backdrop-blur-sm border-white/10',
    primary: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border-blue-500/30',
    success: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-green-500/30',
    warning: 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-yellow-500/30',
    error: 'bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm border-red-500/30'
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
            <h3 className="text-lg font-bold text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-white/10">
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
  <h3 className={`text-lg font-bold text-white ${className}`} {...props}>
    {children}
  </h3>
);

const CardSubtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-300 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`flex-1 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-white/10 ${className}`} {...props}>
    {children}
  </div>
);

// Export all components
export default Card;
export { CardHeader, CardTitle, CardSubtitle, CardContent, CardFooter };


