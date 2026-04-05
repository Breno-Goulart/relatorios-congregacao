/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4A90E2',
          light: '#f0f6ff',
          dark: '#357ABD',
        }
      }
    },
  },
  plugins: [],
}