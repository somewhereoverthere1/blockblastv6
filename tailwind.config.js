/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        pulse: 'pulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 0.7s ease-in-out',
      },
    },
  },
  plugins: [],
};