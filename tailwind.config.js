/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/public/css/*.css",
    "./src/public/layouts/*.ejs",
    "./src/views/*.ejs"
     // Corrected path and added wildcard
  ],
  theme: {
    extend: {
      colors: {
        // You can extend colors here if needed
      },
    },
  },
  plugins: [],
}