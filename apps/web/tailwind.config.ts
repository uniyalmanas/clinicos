import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "-apple-system-monospaced", "'SF Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        'apple-sm': '10px',
        'apple-md': '16px',
        'apple-lg': '22px',
        'apple-xl': '28px',
        'apple-2xl': '36px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        apple: {
          bg: {
            light: "#F5F5F7",
            dark: "#000000",
          },
          card: {
            light: "#FFFFFF",
            dark: "#1C1C1E",
          },
          elevated: {
            light: "#F2F2F7",
            dark: "#2C2C2E",
          },
          input: {
            light: "#E5E5EA",
            dark: "#3A3A3C",
          },
          border: {
            light: "rgba(0, 0, 0, 0.07)",
            dark: "rgba(255, 255, 255, 0.09)",
          },
          blue: {
            light: "#0071E3",
            dark: "#2997FF",
          },
          teal: {
            light: "#00A389",
            dark: "#30D1BE",
          },
          green: {
            light: "#34C759",
            dark: "#30D158",
          },
          amber: {
            light: "#FF9500",
            dark: "#FF9F0A",
          },
          red: {
            light: "#FF3B30",
            dark: "#FF453A",
          }
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1C1C1E",
          darkSubtle: "#2C2C2E",
        },
        border: {
          light: "rgba(0, 0, 0, 0.07)",
          dark: "rgba(255, 255, 255, 0.09)",
        },
        brand: {
          50: "#f0fdf9",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#00A389", // Apple Health Precision Teal
          600: "#008772",
          700: "#006D5C",
          800: "#005548",
          900: "#004238",
          950: "#00241E",
        }
      },
      boxShadow: {
        'apple-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'apple-card': '0 8px 32px -4px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'apple-modal': '0 24px 64px -12px rgba(0, 0, 0, 0.14), 0 8px 24px -4px rgba(0, 0, 0, 0.08)',
        'apple-dark-card': '0 8px 32px -4px rgba(0, 0, 0, 0.7), 0 1px 2px 0 rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
};

export default config;
