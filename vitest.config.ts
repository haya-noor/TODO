import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@domain": path.resolve(__dirname, "./src/app/domain"),
      "@infra": path.resolve(__dirname, "./src/app/infra"),
      "@application": path.resolve(__dirname, "./src/app/application"),
      "@presentation": path.resolve(__dirname, "./src/presentation"),
      "@tests": path.resolve(__dirname, "./tests"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: [path.resolve(__dirname, "./tests/setup.ts")],
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

