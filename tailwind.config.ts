import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial palette — warm paper + ink, one confident accent. No purple.
        paper: "#F1EEE4",
        card: "#FBFAF4",
        ink: "#161410",
        muted: "#5C584C",
        line: "#161410",
        accent: "#1F3BFF", // electric cobalt
        accentink: "#0B1A7A",
        danger: "#D83A2E", // sold out / oversold
        ok: "#0E7A4B", // confirmed / zero oversold
      },
      fontFamily: {
        display: ['"Helvetica Neue"', "Inter", "Arial", "system-ui", "sans-serif"],
        sans: ["Inter", '"Helvetica Neue"', "Arial", "system-ui", "sans-serif"],
        mono: ['"SF Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        hard: "5px 5px 0 0 #161410",
        hardsm: "3px 3px 0 0 #161410",
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
