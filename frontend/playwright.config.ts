import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // list gives readable step-by-step logs in the Actions console; the HTML
  // report is uploaded as an artifact for digging into failures after the fact.
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium-authenticated",
      testMatch: /.*\.authenticated\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    // CI tests the production build, which is what actually ships; locally the
    // dev server keeps the edit-rerun loop fast.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    // Never silently reuse a stale server in CI.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
