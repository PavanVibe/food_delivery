import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.js"],
    env: { NODE_ENV: "test" },
    fileParallelism: false,
    testTimeout: 20000,
  },
});
