import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Mapping shadcn (tokens CSS, themeable) ── */
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },

        /* ── Palette Premier Million (DA « bâtisseur de trésor », hex) ── */
        gold: { DEFAULT: "#e0b450", bright: "#f5d57a", deep: "#a07a30" },
        copper: { DEFAULT: "#c8884a", bright: "#dba566", deep: "#8a5e2e" },
        positive: { DEFAULT: "#94c870", deep: "#5a8b3e" },
        negative: { DEFAULT: "#d97464", deep: "#9a4434" },
        bronze: { DEFAULT: "#c87a3e", deep: "#8a4a1e" },
        silver: { DEFAULT: "#c5c0b0", deep: "#7e7866" },
        surface: {
          DEFAULT: "#1e1a14",
          deep: "#0b0908",
          2: "#252019",
          3: "#2f2920",
          hover: "#38301f",
        },
        ink: {
          DEFAULT: "#f5ead0",
          soft: "#d6c595",
          muted: "#a08b6e",
          dim: "#5a4a3e",
          faint: "#3d2e26",
        },
      },
      borderRadius: {
        lg: "16px",
        md: "10px",
        sm: "6px",
        pill: "999px",
      },
      fontFamily: {
        display: ['var(--font-display)', '"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['var(--font-sans)', "Geist", "system-ui", "sans-serif"],
        mono: ['var(--font-mono)', '"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        eyebrow: "0.2em",
        tag: "0.12em",
      },
      boxShadow: {
        "elev-1": "0 1px 2px 0 hsl(0 0% 0% / 0.4)",
        "elev-2": "0 4px 12px -2px hsl(0 0% 0% / 0.5)",
        "elev-3": "0 12px 32px -8px hsl(0 0% 0% / 0.6)",
        gold: "0 0 24px -4px rgba(224, 180, 80, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
