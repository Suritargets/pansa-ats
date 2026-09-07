import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Server Components-only marker: throws unconditionally on its default (client) export.
      // Next.js resolves the `react-server` condition to a no-op during RSC bundling; vitest
      // runs plain Node, so alias it to the same no-op the framework uses server-side.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
})
