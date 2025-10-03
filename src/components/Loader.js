'use client';

const Loader = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = '',
  fullScreen = false,
  variant = 'spinner'
}) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const colors = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600'
  };
  
  const spinnerClasses = `animate-spin ${sizes[size]} ${colors[color]} ${className}`;
  
  // Spinner variant
  const SpinnerLoader = () => (
    <div className="flex flex-col items-center justify-center">
      <svg className={spinnerClasses} fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className={`mt-2 text-sm ${colors[color]}`}>{text}</p>
      )}
    </div>
  );
  
  // Dots variant
  const DotsLoader = () => (
    <div className="flex flex-col items-center justify-center">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizes[size]} rounded-full ${colors[color]} animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
      {text && (
        <p className={`mt-2 text-sm ${colors[color]}`}>{text}</p>
      )}
    </div>
  );
  
  // Pulse variant
  const PulseLoader = () => (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizes[size]} rounded-full ${colors[color]} animate-pulse`} />
      {text && (
        <p className={`mt-2 text-sm ${colors[color]}`}>{text}</p>
      )}
    </div>
  );
  
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      default:
        return <SpinnerLoader />;
    }
  };
  
  const content = renderLoader();
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return content;
};

// Skeleton Loader Component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '',
  animate = true 
}) => {
  const animationClass = animate ? 'animate-pulse' : '';
  
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 bg-secondary-200 rounded ${animationClass}`}
          style={{
            width: index === lines - 1 ? '75%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

// Card Skeleton Loader
export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-secondary-200 p-6 ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-secondary-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-secondary-200 rounded"></div>
        <div className="h-4 bg-secondary-200 rounded w-5/6"></div>
        <div className="h-4 bg-secondary-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
);

// Table Skeleton Loader
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-white rounded-lg border border-secondary-200 overflow-hidden ${className}`}>
    <div className="animate-pulse">
      {/* Header */}
      <div className="bg-secondary-50 px-6 py-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-secondary-200 rounded flex-1"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-t border-secondary-200">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-secondary-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Loader;
