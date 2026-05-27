import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#f8f5ef",
        ink: "#1f2937",
        accent: "#0f766e",
        accentSoft: "#99f6e4",
      },
    },
  },
  plugins: [],
};

export default config;
