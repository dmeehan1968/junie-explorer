import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src',
  workers: 10,
  use: {
    headless: true,
  },
  webServer: {
    command: 'JETBRAINS_LOG_PATH=./fixtures bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI, // Don’t restart locally if running dev server
    timeout: 5_000,
    // stderr: 'pipe',
    // stdout: 'pipe',
  },
  projects: [
    {
      name: 'unit',
      testMatch: ['**/*.test.ts', '**/*.test.tsx'],
    },
    {
      name: 'e2e',
      testMatch: ['**/*.e2e.ts', '**/*.e2e.tsx'],
    },
  ]
})