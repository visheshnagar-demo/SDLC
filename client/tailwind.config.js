/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D7A52",
          hover: "#095C3E",
          light: "#E7F5EE",
        },
        secondary: {
          DEFAULT: "#2C694E",
          light: "#EAF3EF",
        },
        accent: {
          DEFAULT: "#E76F51",
          light: "#FDF0ED",
        },
        surface: "#FFFFFF",
        background: "#F5FAF7",
        border: "#DBE5E0",
        textPrimary: "#171F24",
        textMuted: "#6B7A73",
        status: {
          success: "#149E4D",
          warning: "#E5941A",
          error: "#D92929",
          info: "#2563EB",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
