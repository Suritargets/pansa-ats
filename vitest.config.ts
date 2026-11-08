/**
 * vitest.config.ts
 * WAT:    Config voor unit tests van pure rekenregels in src/lib/ (geen DB, geen browser nodig).
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
