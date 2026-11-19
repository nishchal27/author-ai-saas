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
    ],
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
