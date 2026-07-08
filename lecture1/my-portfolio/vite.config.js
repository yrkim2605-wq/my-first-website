import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const isVercel = Boolean(process.env.VERCEL)

export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : '/my-first-website/my-portfolio/',
  build: {
    outDir: isVercel ? 'dist' : fileURLToPath(new URL('../../my-portfolio', import.meta.url)),
    emptyOutDir: true,
  },
})
