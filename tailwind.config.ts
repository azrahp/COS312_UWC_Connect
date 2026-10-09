import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        uwc: {
          blue: "#002855",
          navy: "#0B1D3A",
          gold: "#FFC72C",
          yellow: "#E5A800",
          lightBlue: "#1D4ED8",
          sky: "#E0F2FE",
          cardDark: "#111827",
          borderDark: "#1F2937",
        },
      },
    },
  },
  plugins: [],
};
export default config;
