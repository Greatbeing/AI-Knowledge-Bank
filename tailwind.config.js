// tailwind.config.js ? Shared Tailwind config for AI Knowledge Bank
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./assets/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Noto Sans SC", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        deep: "#02040a",
        surface: "#0f172a",
        primary: "#10b981",
        primaryGlow: "#34d399",
        accent: "#f59e0b",
        accentGlow: "#fbbf24",
        ink: "#111827",
        muted: "#667085",
        line: "rgba(17, 24, 39, 0.1)",
        paper: "#f7f8f4",
        glass: "rgba(255, 255, 255, 0.56)",
        glassStrong: "rgba(255, 255, 255, 0.78)",
        jade: "#0f9f8e",
        jadeDark: "#087d72",
        gold: "#d3912c",
        coral: "#d96a43",
        violet: "#6d5bd0",
      },
      animation: {
        "gradient-shift": "gradientShift 5s ease infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
