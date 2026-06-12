/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "#080812",
        surface: "rgba(255,255,255,0.05)",
        border: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#F59E0B",
          dim: "rgba(245,158,11,0.15)",
          glow: "rgba(245,158,11,0.3)",
        },
        violet: {
          accent: "#8B5CF6",
          dim: "rgba(139,92,246,0.15)",
        },
      },
      backdropBlur: {
        xs: "4px",
      },
      animation: {
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 0.3s ease both",
        "scale-in": "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        scaleIn: {
          from: { opacity: 0, transform: "scale(0.95)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
