/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#06B6D4",
        secondary: "#10B981",
        accent: "#10B981",
        background: "#0B0F19",
        surface: "#111827",
      },
    },
  },
  plugins: [],
};
