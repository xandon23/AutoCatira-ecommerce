import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./__tests__/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
