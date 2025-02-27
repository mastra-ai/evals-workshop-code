import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  process.env = { ...process.env, ...loadEnv(mode || 'test', process.cwd(), '') }

  return {
    test: {
      setupFiles: ['dotenv/config'],
      env: process.env,
    },
  }
})
