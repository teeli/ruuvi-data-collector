/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

/* oxlint-disable no-default-export */
export default defineConfig({ plugins: [tsconfigPaths()], test: { setupFiles: ['src/testing/setup.ts'] } })
