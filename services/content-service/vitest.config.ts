import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/*.d.ts",
        "src/main.ts",
        "src/**/*id-generator.ts",
        "src/**/domain/*.repository.ts",
        "src/**/domain/*.reader.ts",
        "src/**/domain/*.storage.ts",
      ],
      reporter: ["text", "html", "lcov"],
      all: true,
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
  },
});
