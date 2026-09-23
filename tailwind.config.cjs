/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        red: { 650: '#dc2626' },
        slate: {
          150: '#e9eef5',
          350: '#a8b3c3',
          450: '#7b8ba1',
          550: '#55657a',
          650: '#3b4b60',
          755: '#263448',
          850: '#172033',
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
