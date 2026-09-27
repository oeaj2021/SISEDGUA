/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zonal-navy': '#0B132B',
        'slate-surface': '#1C2541',
        'guarico-gold': '#F59E0B',
        'bio-emerald': '#10B981',
        'alert-crimson': '#EF4444',
        'cyber-cyan': '#06B6D4'
      },
      boxShadow: {
        'antigravity': '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        'antigravity-glow': '0 20px 40px -15px rgba(16, 185, 129, 0.25)',
        'gold-glow': '0 20px 40px -15px rgba(245, 158, 11, 0.3)'
      }
    },
  },
  plugins: [],
}
