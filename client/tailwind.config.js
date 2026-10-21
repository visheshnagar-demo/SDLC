/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F59E0B",
        accent: "#BE185D",
        surface: "#0B1326",
        background: "#0B0F19",
        card: "#0F172A",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Syne"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
