/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dgYellow: "#E5B800",
        dgYellowAccent: "#FFCC00",
      },
    },
  },
  plugins: [],
};
