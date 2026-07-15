import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/daywise/'

// Beta build version, derived automatically from git at build time:
//   YYYY.MM.DD.NNN — the date of the HEAD commit, then a per-day build number
//   (the count of commits made on that date), starting at 001 each day.
// Requires full git history at build time (workflow uses fetch-depth: 0).
function buildVersion(): string {
  try {
    const date = execSync('git log -1 --date=short --format=%cd').toString().trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'dev'
    const dates = execSync('git log --date=short --format=%cd').toString().trim().split('\n')
    const n = dates.filter((d) => d === date).length
    return `${date.replace(/-/g, '.')}.${String(n).padStart(3, '0')}`
  } catch {
    return 'dev'
  }
}

// Served from https://lachlan-odea.github.io/daywise/
export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // The installed app is scoped to launch into the app (/app), not the marketing site.
      manifest: {
        name: 'daywise',
        short_name: 'daywise',
        description: 'Turn everyday teaching into professional evidence — automatically.',
        id: `${BASE}app`,
        start_url: `${BASE}app`,
        scope: BASE,
        display: 'standalone',
        theme_color: '#132145',
        background_color: '#ffffff',
        categories: ['education', 'productivity'],
        icons: [
          { src: `${BASE}pwa-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE}pwa-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE}pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/404\.html$/],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
