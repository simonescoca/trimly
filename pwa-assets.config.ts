import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Icons are generated once into public/ (npm run icons) and committed.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    // Full-bleed backgrounds: Android masks and iOS rounds the icon themselves.
    maskable: { ...minimal2023Preset.maskable, padding: 0.18, resizeOptions: { background: '#5B4CF0' } },
    apple: { ...minimal2023Preset.apple, padding: 0.06, resizeOptions: { background: '#5B4CF0' } },
  },
  images: ['public/logo.svg'],
})
