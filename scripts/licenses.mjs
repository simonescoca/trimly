// Writes public/third-party-licenses.txt: licences of the code shipped to users' browsers.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const PACKAGES = [
  ['react', 'https://github.com/facebook/react'],
  ['react-dom', 'https://github.com/facebook/react'],
  ['scheduler', 'https://github.com/facebook/react'],
  ['lucide-react', 'https://github.com/lucide-icons/lucide'],
  ['@fontsource-variable/inter', 'https://github.com/rsms/inter'],
  ['heic-to', 'https://github.com/hoppergee/heic-to (bundles libheif: https://github.com/strukturag/libheif)'],
  ['utif2', 'https://github.com/photopea/UTIF.js'],
  ['pako', 'https://github.com/nodeca/pako'],
  ['workbox-window', 'https://github.com/GoogleChrome/workbox'],
]

const sections = PACKAGES.map(([name, source]) => {
  const dir = join(root, 'node_modules', name)
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)/i.test(f))
  const text = file && existsSync(join(dir, file)) ? readFileSync(join(dir, file), 'utf8').trim() : `License: ${pkg.license}`
  return [`${'='.repeat(78)}`, `${name} ${pkg.version} — ${pkg.license}`, `Source code: ${source}`, '', text, ''].join('\n')
})

const header = `Trimly — third-party software

Trimly runs entirely in your browser and includes the open-source software listed below.
The HEIC decoder (heic-to / libheif, LGPL-3.0) is shipped unmodified as a separate file
(assets/heic-to-*.js), loaded only when a HEIC/HEIF image is opened; its complete source code
is available at the address given below. The LGPL v3 builds on the GNU GPL v3:
https://www.gnu.org/licenses/gpl-3.0.txt
`
writeFileSync(join(root, 'public/third-party-licenses.txt'), [header, ...sections].join('\n'))
console.log('public/third-party-licenses.txt written')
