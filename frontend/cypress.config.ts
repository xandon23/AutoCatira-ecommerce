import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "https://autozoom.local",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
