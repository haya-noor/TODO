import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@domain": path.resolve(__dirname, "./src/domain"),
      "@infra": path.resolve(__dirname, "./src/infra"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/domain/**/*.ts"],
      exclude: [
        "src/domain/**/*.schema.ts",
        "src/domain/brand/**",
        "src/domain/utils/**",
      ],
    },
    testTimeout: 10000,
  },
});

