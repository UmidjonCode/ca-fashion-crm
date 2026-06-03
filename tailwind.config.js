const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0f0f12',
          50: '#18181f',
          100: '#1a1a23',
          200: '#22222d',
          300: '#2a2a35',
          400: '#35354a',
          500: '#4a4a5a',
          600: '#6b6b80',
          700: '#8b8ba0',
          800: '#b0b0c0',
          900: '#d5d5e0',
        },
        carbon: {
          DEFAULT: '#1a1a23',
          light: '#22222d',
          border: '#2a2a35',
          hover: '#2f2f3d',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px -4px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.4), 0 8px 32px -8px rgba(0,0,0,0.5)',
        'topbar': '0 1px 0 0 rgba(255,255,255,0.04), 0 4px 24px -4px rgba(0,0,0,0.5)',
        'glow-teal': '0 0 20px -4px rgba(45,212,191,0.35)',
        'glow-rose': '0 0 20px -4px rgba(251,113,133,0.35)',
        'glow-lime': '0 0 20px -4px rgba(163,230,53,0.35)',
        'glow-orange': '0 0 20px -4px rgba(251,146,60,0.35)',
        'ring-btn': '0 0 0 2px rgba(45,212,191,0.25)',
      },
      keyframes: {
        'bounce-dots': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        'ring-fill': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '25' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'bounce-dots': 'bounce-dots 1.4s ease-in-out infinite',
        'ring-fill': 'ring-fill 1.2s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.25s ease-out forwards',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
