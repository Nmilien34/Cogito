/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F5C644", // Yellowish gold for buttons
        accent: "#F5C644", // Yellowish gold
        danger: "#D7263D",
        background: "#FAFAF8", // Off-white background
        paper: "#FAFAF8", // Warm off-white paper color
        slate: {
          950: "#FAFAF8", // Override dark backgrounds with off-white
        },
      },
    },
  },
  plugins: [],
};

