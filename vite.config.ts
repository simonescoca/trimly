/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { SECURITY_HEADERS, headersFile } from './hosting.config.ts'

/** Writes the host's `_headers` file into the build output. */
const hostingHeaders = (): Plugin => ({
  name: 'trimly-hosting-headers',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile() })
  },
})

export default defineConfig({
  plugins: [
    react(),
    hostingHeaders(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Trimly',
        short_name: 'Trimly',
        description: 'Crop any image in your browser: free-form, standard ratios, rounded square and transparent circle.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#5b4cf0',
        background_color: '#f6f6f8',
        categories: ['photo', 'productivity', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Installed app: images can be opened with Trimly from the system share / open-with menus.
        file_handlers: [
          {
            action: '/',
            accept: {
              'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tif', '.tiff', '.heic', '.heif', '.avif', '.svg', '.ico'],
            },
          },
        ],
      },
      workbox: {
        // Everything is cached for offline use, including the HEIC decoder (~3 MB).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        // Italian and English only need the Latin font subsets.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // `vite preview` serves the build with the same security headers as the live site.
  preview: { headers: SECURITY_HEADERS },
  build: {
    // The HEIC decoder (~3 MB, WebAssembly inside) is loaded only when a HEIC file is opened.
    chunkSizeWarningLimit: 3200,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
