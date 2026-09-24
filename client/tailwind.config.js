/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        surface: "#0F172A",
        surfaceLight: "#1E293B",
        primary: "#6366F1",
        accent: "#8083FF",
        secondary: "#38BDF8",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#F43F5E",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
