import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      /* -----------------------------------
         🎨 LUXURY COLOR SYSTEM (BAK55)
      ----------------------------------- */
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8b5cf6', // Royal Purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#06d6a0', // Emerald Green
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#ffd166', // Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#1a1a1a', // Charcoal
        },
        luxury: {
          glass: 'rgba(255, 255, 255, 0.08)',
          'glass-border': 'rgba(255, 255, 255, 0.12)',
          'glass-hover': 'rgba(255, 255, 255, 0.16)',
        },
      },

      /* -----------------------------------
         ✨ TYPOGRAPHY
      ----------------------------------- */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      /* -----------------------------------
         🧱 BORDER RADIUS & SPACING
      ----------------------------------- */
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },

      /* -----------------------------------
         🌈 SHADOWS & EFFECTS
      ----------------------------------- */
      boxShadow: {
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.36)',
        'glow-primary': '0 0 25px rgba(139, 92, 246, 0.5)',
        'glow-secondary': '0 0 25px rgba(6, 214, 160, 0.4)',
      },

      backdropBlur: {
        'xs': '2px',
      },

      /* -----------------------------------
         🎞️ ANIMATIONS & KEYFRAMES
      ----------------------------------- */
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-move': 'gradientMove 6s ease infinite',
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
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        gradientMove: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}

export default config
