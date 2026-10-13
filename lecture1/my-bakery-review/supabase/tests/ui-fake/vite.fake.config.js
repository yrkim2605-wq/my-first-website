// 화면 시험용 Vite 설정: '@supabase/supabase-js'를 가짜 서버로 바꿔서 계정 모드를 진짜 서버 없이 확인해요.
// 실행 (프로젝트 폴더에서):  npx vite --config supabase/tests/ui-fake/vite.fake.config.js --port 5195
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../..', import.meta.url))

export default defineConfig({
  root,
  plugins: [react()],
  base: '/my-first-website/my-bakery-review/',
  resolve: { alias: { '@supabase/supabase-js': fileURLToPath(new URL('./fake-supabase-js.js', import.meta.url)) } },
  define: {
    'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('supabase'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fake.supabase.test'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fake_for_ui_test'),
  },
})
