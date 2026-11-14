import { defineConfig } from "vitest/config";
import path from "path";

// Mirrors the path aliases in tsconfig.json — Vitest uses Vite's resolver,
// which doesn't read tsconfig "paths" automatically.
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@sahl/shared": path.resolve(__dirname, "../../packages/shared"),
    },
  },
});
