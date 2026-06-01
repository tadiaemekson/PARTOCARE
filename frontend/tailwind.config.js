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
          bg: '#0b0f19',      // HSL(222, 47%, 5%)
          card: '#111827',    // HSL(222, 40%, 10%)
          border: '#20293a',  // HSL(222, 30%, 18%)
          text: '#f8fafc',    // HSL(210, 40%, 98%)
          muted: '#94a3b8',   // HSL(215, 20%, 65%)
        },
        status: {
          green: '#10b981',   // HSL(142, 70%, 45%) - Normal
          yellow: '#f59e0b',  // HSL(45, 93%, 47%) - Surveillance
          orange: '#f97316',  // HSL(24, 95%, 50%) - Risk
          red: '#ef4444',     // HSL(0, 84%, 48%) - Critical
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
