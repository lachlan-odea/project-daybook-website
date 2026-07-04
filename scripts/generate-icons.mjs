// Generates PWA icons from the Project Daybook logo mark.
// Run with: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '..', 'public')

// The book mark, drawn on a 64×64 canvas (matches src/components/Logo.tsx).
const MARK = `
  <path d="M32 20C26 16 18 15.5 12 17V47C18 45.5 26 46 32 50V20Z" fill="#8ecdff"/>
  <path d="M32 20C38 16 46 15.5 52 17V47C46 45.5 38 46 32 50V20Z" fill="#96e5cd"/>
  <path d="M32 20C27 17 21 16.5 16 17.5V46C21 45 27 45.5 32 48.5V20Z" fill="#20336c"/>
  <path d="M32 20C37 17 43 16.5 48 17.5V46C43 45 37 45.5 32 48.5V20Z" fill="#17a085"/>
  <circle cx="22.5" cy="26" r="1.7" fill="#5dd2b1"/>
  <circle cx="22.5" cy="31.5" r="1.7" fill="#59b0fb"/>
  <circle cx="22.5" cy="37" r="1.7" fill="#3491f0"/>
  <rect x="25.5" y="25" width="4.5" height="2" rx="1" fill="#ffffff"/>
  <rect x="25.5" y="30.5" width="4.5" height="2" rx="1" fill="#ffffff"/>
  <rect x="25.5" y="36" width="4.5" height="2" rx="1" fill="#ffffff"/>
  <path d="M35 29.5l2.4 2.4 4.6-4.8" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="35" y="35" width="7" height="2" rx="1" fill="#ffffff"/>
  <path d="M32 6l1.1 2.7 2.7 1.1-2.7 1.1L32 13.6l-1.1-2.7-2.7-1.1 2.7-1.1L32 6z" fill="#2fba93"/>
  <path d="M24 10l.7 1.7 1.7.7-1.7.7L24 14.8l-.7-1.7-1.7-.7 1.7-.7L24 10z" fill="#20336c"/>
  <path d="M40 10l.7 1.7 1.7.7-1.7.7L40 14.8l-.7-1.7-1.7-.7 1.7-.7L40 10z" fill="#3491f0"/>
`

const NAVY = '#132145'

// scale/translate map the 64-unit mark into a 512 canvas at the given scale, centred.
const markGroup = (scale) => {
  const cx = 32 * scale
  const cy = 28 * scale
  return `<g transform="translate(${256 - cx} ${256 - cy}) scale(${scale})">${MARK}</g>`
}

const anyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${NAVY}"/>
  ${markGroup(7.2)}
</svg>`

// Maskable: full-bleed background + extra padding so the mark stays inside the safe zone.
const maskableIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${NAVY}"/>
  ${markGroup(5.6)}
</svg>`

const targets = [
  { svg: anyIcon, size: 192, file: 'pwa-192.png' },
  { svg: anyIcon, size: 512, file: 'pwa-512.png' },
  { svg: maskableIcon, size: 512, file: 'pwa-maskable-512.png' },
  { svg: anyIcon, size: 180, file: 'apple-touch-icon.png' },
]

for (const t of targets) {
  await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(join(out, t.file))
  console.log('wrote', t.file, `(${t.size}px)`)
}
