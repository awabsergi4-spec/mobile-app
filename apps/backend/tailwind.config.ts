import type { Config } from "tailwindcss";

// SAIR-orange design tokens — kept numerically identical to
// apps/mobile/lib/core/theme/app_colors.dart so the Admin Platform and the
// Flutter app read as one product, not two. If either changes, update both.
const config: Config = {
  content: ["./src/app/admin/**/*.{ts,tsx}", "./src/presentation/admin-ui/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#F57C00",
        secondary: "#E65100",
        accent: "#FFB300",
        success: "#2E7D32",
        warning: "#F9A825",
        error: "#D32F2F",
        info: "#1976D2",
        "background-light": "#FAFAFA",
        "background-dark": "#121212",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E1E1E",
        "text-primary": "#212121",
        "text-secondary": "#616161",
        "text-disabled": "#9E9E9E",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
