/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0b0f17",
        surface: "#0f131c",
        card: "#111622",
        primary: {
          DEFAULT: "#06b6d4",
          light: "#4cd7f6",
          dark: "#0891b2",
        },
        accent: "#4cd7f6",
        status: {
          healthy: "#10b981",
          degraded: "#f59e0b",
          down: "#f43f5e",
        },
        content: {
          primary: "#dfe2ee",
          secondary: "#bcc9cd",
          muted: "#64748b",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
