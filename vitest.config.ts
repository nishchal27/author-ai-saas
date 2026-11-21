import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "lib/ai/**/*.test.ts",
      "lib/ai/**/*.spec.ts",
      "lib/brand/**/*.test.ts",
      "lib/brand-context/**/*.test.ts",
      "lib/usage/**/*.test.ts",
      "lib/pillars/**/*.test.ts",
      "lib/ideas/**/*.test.ts",
      "lib/planner/**/*.test.ts",
      "lib/validation/**/*.test.ts",
      "lib/guide/**/*.test.ts",
      "lib/security/**/*.test.ts",
      "lib/products/**/*.test.ts",
      "lib/onboarding/**/*.test.ts",
      "lib/brand/**/*.test.ts",
      "lib/content/**/*.test.ts",
      "lib/strategy/**/*.test.ts",
      "lib/rate-limit/**/*.test.ts",
      "lib/settings/**/*.test.ts",
    ],
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
