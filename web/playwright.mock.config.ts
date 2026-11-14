import { defineConfig, devices } from "@playwright/test";

/**
 * E2E против локального мока API: правки текстов, заметки, теги, бюджет.
 * Отдельный конфиг и порт, чтобы не мешать обычным скриншот-прогонам.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /(editing|budget|add-to-day)\.spec\.ts/,
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:8766/china-trip/",
    trace: "off",
  },
  webServer: [
    {
      command: "node e2e/mock-api.mjs",
      url: "http://127.0.0.1:8790/api/health",
      reuseExistingServer: true,
      timeout: 30_000,
      stdout: "ignore",
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 8766",
      url: "http://127.0.0.1:8766/china-trip/",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
      env: { VITE_TRIP_API: "http://127.0.0.1:8790" },
    },
  ],
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }],
});
