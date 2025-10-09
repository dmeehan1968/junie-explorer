import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.test.ts',
  webServer: {
    command: 'JETBRAINS_LOG_PATH=./fixtures bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI, // Don’t restart locally if running dev server
    timeout: 5_000,
    // stderr: 'pipe',
    // stdout: 'pipe',
  },
  workers: 10,
  use: {
    headless: true,
  }
})