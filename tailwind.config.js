/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          indigo: "#3949AB",
          "indigo-hover": "#303F9F",
          "indigo-subtle": "#EEF2FF",
          teal: "#0F766E",
          "teal-hover": "#0D655E",
          "teal-subtle": "#F0FDFA",
        },
        // Neutral Palette
        page: "#F7F8FA",
        surface: "#FFFFFF",
        subtle: "#F1F3F6",
        main: "#20242C",
        secondary: "#687180",
        border: "#E5E7EB",
        // Status & Priority Colors (restrained)
        priority: {
          low: "#687180",
          med: "#0F766E",
          high: "#D97706",
          urgent: "#DC2626",
        },
        status: {
          todo: "#687180",
          progress: "#3949AB",
          blocked: "#DC2626",
          done: "#0F766E",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};