/* global document -- used inside page.evaluate, which runs in the browser */
// Renders the social preview image (public/og-image.jpg, 1200×630) with headless Chromium.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const root = join(import.meta.dirname, '..')
const font = readFileSync(join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')).toString('base64')
const sample = readFileSync(join(root, 'src/assets/sample.svg')).toString('base64')
const logo = readFileSync(join(root, 'public/logo.svg')).toString('base64')

const html = `<!doctype html><html><head><style>
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, sans-serif; color: #f3f3f5;
  background: radial-gradient(70% 90% at 85% 50%, #3a2d8f 0%, transparent 70%), linear-gradient(135deg, #0d0d10, #17142e); }
.wrap { display: flex; align-items: center; height: 100%; padding: 0 84px; gap: 40px; }
.text { flex: 1; }
.brand { display: flex; align-items: center; gap: 20px; margin-bottom: 36px; }
.brand img { width: 84px; height: 84px; }
.brand span { font-size: 64px; font-weight: 700; letter-spacing: -0.03em; }
h1 { font-size: 50px; line-height: 1.12; font-weight: 680; letter-spacing: -0.025em; margin-bottom: 26px; }
p { font-size: 25px; color: #b9b6d8; line-height: 1.4; }
.pills { display: flex; gap: 12px; margin-top: 34px; }
.pill { padding: 10px 18px; border-radius: 999px; background: rgba(140,128,255,.16); border: 1px solid rgba(140,128,255,.4); font-size: 20px; font-weight: 560; color: #d9d5ff; }
.art { position: relative; width: 400px; height: 400px; flex: none; }
.art .square { position: absolute; left: 0; top: 34px; width: 230px; height: 230px; border-radius: 52px; overflow: hidden; opacity: .55; transform: rotate(-8deg);
  box-shadow: 0 30px 60px rgba(0,0,0,.4); }
.art .circle { position: absolute; right: 0; bottom: 0; width: 330px; height: 330px; border-radius: 50%; overflow: hidden;
  box-shadow: 0 0 0 8px #fff, 0 40px 80px rgba(0,0,0,.55); }
.art img.photo { width: 100%; height: 100%; object-fit: cover; }
.checker { position: absolute; inset: -6px; border-radius: 50%; }
</style></head><body><div class="wrap">
<div class="text">
  <div class="brand"><img src="data:image/svg+xml;base64,${logo}"><span>Trimly</span></div>
  <h1>Crop any image,<br>in a moment.</h1>
  <p>Free-form, standard ratios, rounded square<br>or a transparent circle for your profile picture.</p>
  <div class="pills"><span class="pill">Private</span><span class="pill">Free</span><span class="pill">Works offline</span></div>
</div>
<div class="art">
  <div class="square"><img class="photo" src="data:image/svg+xml;base64,${sample}" style="object-position: 20% 50%"></div>
  <div class="circle"><img class="photo" src="data:image/svg+xml;base64,${sample}" style="object-position: 62% 50%"></div>
</div>
</div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(root, 'public/og-image.jpg'), type: 'jpeg', quality: 88 })
await browser.close()
console.log('public/og-image.jpg written')
