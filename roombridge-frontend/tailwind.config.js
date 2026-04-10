/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:    '#1A3A5C',
        secondary:  '#2C5F8A',
        accent:     '#93c5fd',
        success:    '#10b981',
        warning:    '#f59e0b',
        error:      '#ef4444',
        background: '#f8fafc',
        border:     '#e5e7eb',
        /* Named text colors — used as bg-text-primary etc. in Tailwind */
        'text-primary':   '#1A3A5C',
        'text-secondary': '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '16px',
        btn:   '8px',
        input: '10px',
      },
      boxShadow: {
        card:  '0 2px 12px rgba(0,0,0,0.08)',
        hover: '0 8px 28px rgba(0,0,0,0.14)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
