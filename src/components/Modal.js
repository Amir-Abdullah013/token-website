'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ 
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  dark = false
}) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      
      // Scroll modal into view if needed
      if (contentRef.current) {
        setTimeout(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    xs: 'max-w-sm',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full'
  };
  
  const darkClasses = dark ? {
    bg: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800',
    border: 'border-slate-600/50',
    title: 'text-white',
    closeButton: 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
    headerBorder: 'border-slate-600/50'
  } : {
    bg: 'bg-white',
    border: 'border-secondary-200',
    title: 'text-secondary-900',
    closeButton: 'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100',
    headerBorder: 'border-secondary-200'
  };

  if (!mounted || typeof document === 'undefined' || !document.body) return null;

  const modalContent = (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={handleOverlayClick}
      style={{ 
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlayClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Modal Content - Centered */}
      <div 
        ref={contentRef}
        className={`relative ${darkClasses.bg} rounded-lg shadow-2xl w-[90%] sm:w-[400px] md:w-auto ${sizeClasses[size]} ${darkClasses.border} border ${className} animate-scale-in max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10000,
          margin: 'auto',
          maxWidth: size === 'full' ? '90%' : undefined,
          transform: 'none',
          top: 'auto',
          left: 'auto'
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-4 sm:p-5 md:p-6 border-b ${darkClasses.headerBorder} flex-shrink-0`}>
            {title && (
              <h2 className={`text-lg sm:text-xl font-semibold ${darkClasses.title} pr-2`}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`p-2 ${darkClasses.closeButton} rounded-lg transition-colors flex-shrink-0`}
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Content - Scrollable */}
        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at body level, outside any parent containers
  return createPortal(modalContent, document.body);
};

// Modal sub-components for better composition
const ModalHeader = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between p-6 border-b border-secondary-200 ${className}`} {...props}>
    {children}
  </div>
);

const ModalTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-xl font-semibold text-secondary-900 ${className}`} {...props}>
    {children}
  </h2>
);

const ModalCloseButton = ({ onClose, className = '', ...props }) => (
  <button
    onClick={onClose}
    className={`p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors ${className}`}
    {...props}
  >
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

const ModalContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 ${className}`} {...props}>
    {children}
  </div>
);

// Confirmation Modal
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'text-secondary-700',
    danger: 'text-error-700',
    warning: 'text-warning-700'
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className={`text-sm ${variantClasses[variant]}`}>
          {message}
        </p>
        
        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              variant === 'danger' 
                ? 'bg-error-600 hover:bg-error-700' 
                : variant === 'warning'
                ? 'bg-warning-600 hover:bg-warning-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// Alert Modal
export const AlertModal = ({
  isOpen,
  onClose,
  title = 'Alert',
  message,
  type = 'info',
  buttonText = 'OK'
}) => {
  const typeClasses = {
    info: 'text-primary-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-700'
  };
  
  const iconClasses = {
    info: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600'
  };
  
  const icons = {
    info: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    error: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${iconClasses[type]}`}>
            {icons[type]}
          </div>
          <p className={`text-sm ${typeClasses[type]}`}>
            {message}
          </p>
        </div>
        
        <ModalFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {buttonText}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

// Export all components
export default Modal;
export { ModalHeader, ModalTitle, ModalCloseButton, ModalContent, ModalFooter };


