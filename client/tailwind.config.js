/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        accent: "#10B981",
        surface: "#0F172A",
        background: "#0B1326",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
      },
    },
  },
  plugins: [],
};
