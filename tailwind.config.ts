import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        geist: ["Geist", "sans-serif"],
        game: ["VT323", "monospace"],
        sans: ["VT323", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
