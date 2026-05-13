/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbf8",
          100: "#d5f4ea",
          200: "#abe8d7",
          300: "#75d8be",
          400: "#42c4a2",
          500: "#21a688",
          600: "#14866f",
          700: "#136b5a",
          800: "#145549",
          900: "#13463d"
        }
      }
    }
  },
  plugins: []
};
