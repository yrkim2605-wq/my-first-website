import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/my-first-website/my-community/',
  build: {
    outDir: fileURLToPath(new URL('../../my-community', import.meta.url)),
    emptyOutDir: true,
  },
})
