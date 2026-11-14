import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  retries: 0,
  use: {
    baseURL:
      process.env.BASE_URL || "http://nba-redesign.stack.avyayv.com:8000",
    viewport: { width: 1440, height: 1080 },
    reducedMotion: "reduce",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {},
  },
  outputDir: ".artifacts/test-results",
});
