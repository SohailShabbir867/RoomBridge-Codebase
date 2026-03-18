/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A3A5C",
        secondary: "#2C5F8A",
      }
    },
  },
  plugins: [],
}
