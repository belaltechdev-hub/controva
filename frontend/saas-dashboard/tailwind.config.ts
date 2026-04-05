import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 👈 बस ये line add करनी है

  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#0ea5e9",
        success: "#22c55e",
        danger: "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;