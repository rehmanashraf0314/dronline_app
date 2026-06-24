/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        'primary-light': '#3b82f6',
        'primary-dark': '#1e3a8a',
        success: '#16a34a',
        danger: '#dc2626',
        warning: '#d97706',
        surface: '#f9fafb',
        border: '#e5e7eb',
      },
    },
  },
  plugins: [],
};
