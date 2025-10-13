// Theme configuration for consistent colors across the application
export const theme = {
  colors: {
    // Primary colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Success colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    // Warning colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Error colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    // Info colors
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    
    // Neutral colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    }
  },
  
  // Component-specific color schemes
  components: {
    // User dashboard theme
    user: {
      primary: '#3b82f6',      // Blue
      secondary: '#64748b',     // Slate
      accent: '#22c55e',        // Green
      background: '#f8fafc',    // Light gray
      surface: '#ffffff',       // White
      text: '#1e293b',          // Dark slate
      textSecondary: '#64748b'  // Medium slate
    },
    
    // Admin dashboard theme
    admin: {
      primary: '#7c3aed',       // Purple
      secondary: '#64748b',      // Slate
      accent: '#f59e0b',        // Amber
      background: '#f8fafc',    // Light gray
      surface: '#ffffff',       // White
      text: '#1e293b',           // Dark slate
      textSecondary: '#64748b'   // Medium slate
    },
    
    // Landing page theme
    landing: {
      primary: '#3b82f6',       // Blue
      secondary: '#64748b',      // Slate
      accent: '#22c55e',        // Green
      background: '#ffffff',     // White
      surface: '#f8fafc',        // Light gray
      text: '#1e293b',           // Dark slate
      textSecondary: '#64748b'   // Medium slate
    }
  },
  
  // Status colors
  status: {
    online: '#22c55e',          // Green
    offline: '#ef4444',         // Red
    pending: '#f59e0b',         // Amber
    processing: '#3b82f6',      // Blue
    completed: '#22c55e',       // Green
    failed: '#ef4444',          // Red
    cancelled: '#64748b'        // Slate
  },
  
  // Transaction status colors
  transaction: {
    pending: '#f59e0b',         // Amber
    completed: '#22c55e',       // Green
    failed: '#ef4444',          // Red
    cancelled: '#64748b',       // Slate
    processing: '#3b82f6'       // Blue
  },
  
  // Notification type colors
  notification: {
    info: '#3b82f6',            // Blue
    success: '#22c55e',         // Green
    warning: '#f59e0b',         // Amber
    error: '#ef4444'            // Red
  }
};

// Theme utility functions
export const themeUtils = {
  // Get component colors
  getComponentColors(component) {
    return theme.components[component] || theme.components.user;
  },
  
  // Get status color
  getStatusColor(status) {
    return theme.status[status] || theme.colors.neutral[500];
  },
  
  // Get transaction status color
  getTransactionColor(status) {
    return theme.transaction[status] || theme.colors.neutral[500];
  },
  
  // Get notification color
  getNotificationColor(type) {
    return theme.notification[type] || theme.colors.neutral[500];
  },
  
  // Generate color variants
  generateColorVariants(baseColor) {
    return {
      light: `${baseColor}20`,
      medium: `${baseColor}40`,
      dark: `${baseColor}80`
    };
  }
};

// CSS custom properties for dynamic theming
export const generateCSSVariables = (component = 'user') => {
  const colors = themeUtils.getComponentColors(component);
  
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-background': colors.background,
    '--color-surface': colors.surface,
    '--color-text': colors.text,
    '--color-text-secondary': colors.textSecondary
  };
};

export default theme;

























