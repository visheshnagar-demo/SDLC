/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#06b6d4",
          accent: "#38bdf8",
          surface: "#0f172a",
          card: "#131e3a",
          background: "#0b1326",
          border: "#1e293b",
          textPrimary: "#dae2fd",
          textSecondary: "#bcc9cd",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#f43f5e",
        },
      },
    },
  },
  plugins: [],
};
