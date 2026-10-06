/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488",
          hover: "#0F766E",
          active: "#115E59",
          light: "#F0FDFA",
        },
        secondary: {
          DEFAULT: "#0F172A",
        },
        accent: {
          DEFAULT: "#0284C7",
        },
      },
    },
  },
  plugins: [],
};
