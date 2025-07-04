/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      animation: {
        'float-slow': 'float 15s ease-in-out infinite',
        'float-medium': 'float 12s ease-in-out infinite',
        'float-fast': 'float 10s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-10px) translateX(10px)' },
          '50%': { transform: 'translateY(0) translateX(20px)' },
          '75%': { transform: 'translateY(10px) translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
} 