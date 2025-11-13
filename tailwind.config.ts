import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#edfbff",
          100: "#d6f1ff",
          200: "#b0e5ff",
          300: "#7ad3ff",
          400: "#3db6ff",
          500: "#1198ff",
          600: "#0079f1",
          700: "#005fca",
          800: "#024fa4",
          900: "#063f82",
        },
        midnight: {
          950: "#02030a",
          900: "#050b18",
          800: "#0c1426",
          700: "#17213b",
          600: "#24304e",
        },
        accent: "#f97316",
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at top, rgba(17,152,255,0.35) 0%, rgba(2,3,10,0) 55%)",
        "radial-orange":
          "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.25), transparent 55%)",
      },
      boxShadow: {
        "soft-glow":
          "0 10px 40px rgba(17, 152, 255, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "card-border": "0 0 0 1px rgba(255,255,255,0.08)",
      },
      borderRadius: {
        "4xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
