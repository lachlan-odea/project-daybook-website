import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://lachlan-odea.github.io/project-daybook-website/
export default defineConfig({
  base: '/project-daybook-website/',
  plugins: [react()],
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
