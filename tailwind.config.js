/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        ink: "#20261F",
        paper: "#F6F4EC",
        "paper-dim": "#EFEBDE",
        pine: {
          DEFAULT: "#16342B",
          light: "#1F4B3D",
          dark: "#0E241D",
        },
        education: {
          DEFAULT: "#C68A3D",
          light: "#E4B36D",
          dark: "#9A6A28",
        },
        health: {
          DEFAULT: "#3B6EA5",
          light: "#6C97C6",
          dark: "#28517D",
        },
        care: {
          DEFAULT: "#8C3F4D",
          light: "#B26472",
          dark: "#6B2E39",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      backgroundImage: {
        "thread-line":
          "repeating-linear-gradient(90deg, currentColor 0 6px, transparent 6px 12px)",
      },
    },
  },
  plugins: [],
}

