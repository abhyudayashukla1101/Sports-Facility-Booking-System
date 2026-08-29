/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0a0d14",   // page background
          900: "#05070b",
        },
        surface: {
          DEFAULT: "#12161f",   // card / nav background
          hover: "#181c27",
          border: "#232838",
        },
        accent: {
          DEFAULT: "#f4c531",   // signature amber
          foreground: "#0a0d14",
          dim: "#7a642a",
        },
        available: "#3ecf6e",   // slot available
        booked: "#f2545b",      // slot taken / rejected
        passed: "#5b6272",      // slot passed / disabled
        muted: "#cbd5e1",       // secondary text (bright readable gray)
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
}
