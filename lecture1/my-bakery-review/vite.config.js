import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const isVercel = Boolean(process.env.VERCEL)

export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : '/my-first-website/my-bakery-review/',
  build: {
    outDir: isVercel ? 'dist' : fileURLToPath(new URL('../../my-bakery-review', import.meta.url)),
    emptyOutDir: true,
    // 작은 이미지를 JS 안에 base64로 넣으면 첫 화면 JS가 무거워져요.
    // 이미지는 항상 별도 파일로 두고, 폰트만 기본 규칙(4KB 미만이면 CSS에 포함)을 따라요.
    assetsInlineLimit: (filePath) => (/\.(png|jpe?g|webp|svg)$/.test(filePath) ? false : undefined),
  },
})
