/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          DEFAULT: "#F59E0B",
        },
        secondary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          DEFAULT: "#10B981",
        },
        accent: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          DEFAULT: "#0EA5E9",
        },
        tertiary: {
          50: "#fff1f2",
          100: "#ffe4e6",
          500: "#f43f5e",
          DEFAULT: "#F43F5E",
        },
        nutriBg: "#FFFDF7",
      },
      fontFamily: {
        heading: ["Quicksand", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
