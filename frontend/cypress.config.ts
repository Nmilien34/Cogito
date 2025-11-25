import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    supportFile: "cypress/support/e2e.ts",
  },
  env: {
    apiUrl: "http://localhost:4000/api",
  },
});

