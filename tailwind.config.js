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
        coral: "rgb(var(--vc-coral) / <alpha-value>)",
        "coral-strong": "rgb(var(--vc-coral-strong) / <alpha-value>)"
      },
      borderRadius: {
        sm: "var(--vc-radius-sm)",
        md: "var(--vc-radius-md)"
      },
      fontFamily: {
        sans: ["var(--font-vc)", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
