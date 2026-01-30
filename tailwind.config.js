// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'accent-primary': '#3b82f6', // Modern Blue
        'accent-secondary': '#8b5cf6', // Violet
        'surface-dark': '#09090b',  // Zinc 950 (Deep background)
        'surface-card': '#18181b',  // Zinc 900 (Card background)
        'surface-border': '#27272a', // Zinc 800 (Borders)
      },
      fontFamily: {
        mono: ['monospace'], // Or 'Fira Code' if you import it
        sans: ['Inter', 'system-ui', 'sans-serif'], // Modern UI font
      },
    },
  },
  plugins: [],
}