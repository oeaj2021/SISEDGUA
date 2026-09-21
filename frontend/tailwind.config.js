/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gobierno: {
          blue: '#1E3A8A',
          dark: '#0F172A',
          gold: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
