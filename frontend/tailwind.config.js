/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Remove or comment out custom gold colors if present
      // colors: {
      //   gold: {
      //     500: '#d4af37',
      //   },
      // },
    },
  },
  plugins: [],
}
