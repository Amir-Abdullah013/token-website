/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3440px',
      },
      colors: {
        // NeoAurora Theme Colors
        aurora: {
          bg: '#0B1120',
          'bg-deep': '#000000',
          violet: '#8B5CF6',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          text: '#FFFFFF',
          'text-secondary': '#CBD5E1',
          'text-muted': '#94A3B8',
        },
        // Legacy Design System Colors (kept for backward compatibility)
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
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
      },
      backgroundImage: {
        'neo-aurora': 'linear-gradient(135deg, #0B1120, #000000)',
        'aurora-glow': 'linear-gradient(90deg, #8B5CF6, #06B6D4, #3B82F6)',
        'aurora-radial': 'radial-gradient(ellipse at bottom right, #0B1120, #000000)',
        'aurora-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 50%, #3B82F6 100%)',
        'aurora-gradient-vertical': 'linear-gradient(180deg, #8B5CF6 0%, #06B6D4 50%, #3B82F6 100%)',
      },
      boxShadow: {
        'aurora-glow': '0 0 20px rgba(139, 92, 246, 0.25)',
        'aurora-glow-lg': '0 0 40px rgba(139, 92, 246, 0.35)',
        'inner-glow': 'inset 0 0 15px rgba(6, 182, 212, 0.15)',
        'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.3)',
        'violet-glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'aurora-border': '0 0 10px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(6, 182, 212, 0.1)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        heading: ['Space Grotesk', 'var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 3s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
          },
        },
        gradientFlow: {
          '0%, 100%': { 
            backgroundPosition: '0% 50%',
          },
          '50%': { 
            backgroundPosition: '100% 50%',
          },
        },
        shimmer: {
          '0%': { 
            backgroundPosition: '-200% center',
          },
          '100%': { 
            backgroundPosition: '200% center',
          },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}


