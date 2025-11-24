/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1A4D2E",
        accent: "#F2C14E",
        danger: "#D7263D",
        slate: {
          950: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};

