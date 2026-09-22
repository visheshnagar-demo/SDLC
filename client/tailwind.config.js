/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D4AF37",
          hover: "#E5C158",
        },
        gold: {
          400: "#F2CA50",
          500: "#D4AF37",
          600: "#B8972E",
          700: "#896C00",
        },
        surface: {
          DEFAULT: "#181B22",
          elevated: "#1F1F23",
          card: "#12141A",
        },
        dark: {
          bg: "#121316",
          deep: "#0A0B0E",
        },
        luxury: {
          text: "#F8F9FA",
          muted: "#9EACB9",
          border: "#232733",
          borderAccent: "#4D4635",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
