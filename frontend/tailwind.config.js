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
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

