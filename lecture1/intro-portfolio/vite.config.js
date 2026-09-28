import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 메인(index.html), 자기소개(about.html), 프로젝트 상세(project-*.html) 페이지들을 함께 빌드한다
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        projectAi: resolve(import.meta.dirname, 'project-ai.html'),
        projectIllustration: resolve(import.meta.dirname, 'project-illustration.html'),
      },
    },
  },
})
