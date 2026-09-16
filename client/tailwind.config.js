/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hanken Grotesk", "Inter", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          500: "#2563eb",
          800: "#1e3a8a",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
