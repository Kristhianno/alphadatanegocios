/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066CC',
          light: '#E6F0FF',
          dark: '#004C99',
        },
        success: '#22C55E',
        warning: '#F97316',
        danger: '#EF4444',
        surface: '#FFFFFF',
        muted: {
          DEFAULT: '#F5F5F5',
          dark: '#E5E5E5',
          text: '#999999',
        },
      },
      fontSize: {
        logo: ['24px', { fontWeight: '700' }],
        h1: ['28px', { fontWeight: '700' }],
        h2: ['20px', { fontWeight: '700' }],
        body: ['14px', { fontWeight: '400' }],
        label: ['12px', { fontWeight: '400' }],
      },
      borderRadius: {
        card: '8px',
        btn: '6px',
        input: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
        cardHover: '0 4px 6px rgba(0,0,0,0.15)',
      },
      screens: {
        sm: '640px',
        md: '1024px',
      },
    },
  },
  plugins: [],
}
