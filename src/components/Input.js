'use client';

import { forwardRef, useState } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  success,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  className = '',
  labelClassName = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const baseInputClasses = 'block w-full border rounded-lg shadow-sm transition-all duration-200 focus:outline-none disabled:bg-secondary-50 disabled:text-secondary-500 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  const variantClasses = {
    default: error 
      ? 'border-error-300 focus:ring-error-500 focus:border-error-500' 
      : success 
        ? 'border-success-300 focus:ring-success-500 focus:border-success-500'
        : 'border-secondary-300 focus:ring-primary-500 focus:border-primary-500',
    filled: error
      ? 'border-error-300 bg-error-50 focus:ring-error-500 focus:border-error-500'
      : success
        ? 'border-success-300 bg-success-50 focus:ring-success-500 focus:border-success-500'
        : 'border-secondary-300 bg-secondary-50 focus:ring-primary-500 focus:border-primary-500'
  };
  
  const inputClasses = `${baseInputClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  
  const labelClasses = `
    block text-sm font-medium mb-2 transition-colors duration-200
    ${error ? 'text-error-700' : success ? 'text-success-700' : 'text-secondary-700'}
    ${labelClassName}
  `.trim();
  
  const iconClasses = 'absolute inset-y-0 flex items-center pointer-events-none';
  const leftIconClasses = `${iconClasses} left-0 pl-3`;
  const rightIconClasses = `${iconClasses} right-0 pr-3`;
  
  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={leftIconClasses}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${inputClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <div className={rightIconClasses}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center">
          <svg className="h-4 w-4 text-error-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-error-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center">
          <svg className="h-4 w-4 text-success-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-success-600">{success}</p>
        </div>
      )}
      
      {helperText && !error && !success && (
        <p className="mt-2 text-sm text-secondary-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
