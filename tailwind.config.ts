import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#fbfbf9",
        brand: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
          deep: "#3730a3",
        },
        primary: '#10b981',
        secondary: '#06b6d4',
        accent: '#6366f1',
      },
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.18)",
        pop: "0 12px 40px -12px rgba(15,23,42,0.30)",
        glow: "0 0 24px -4px rgba(79,70,229,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flame: {
          "0%,100%": { transform: "scale(1) rotate(-2deg)" },
          "50%": { transform: "scale(1.12) rotate(2deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        flame: "flame 1.6s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
