/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
        },
        accent: {
          50: "#EFF6FF",
          500: "#3B82F6",
          600: "#2563EB",
        },
      },
    },
  },
  plugins: [],
};
