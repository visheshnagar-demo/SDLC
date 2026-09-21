/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        jms: {
          bg: "#090D16",
          surface: "#0F172A",
          border: "#334155",
          primary: "#2563EB",
          accent: "#38BDF8",
          text: "#F8FAFC",
          muted: "#94A3B8",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
    },
  },
  plugins: [],
};
