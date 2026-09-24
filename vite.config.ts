/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // The HEIC decoder (~3 MB, WebAssembly inside) is loaded only when a HEIC file is opened.
    chunkSizeWarningLimit: 3200,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
