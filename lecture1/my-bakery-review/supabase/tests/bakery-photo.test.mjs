// 빵집 사진 정책 검증 (브라우저 없이 서버 렌더링).
//  - 리뷰 사진이 있으면 그 사진, 없으면 빵 기사 플레이스홀더(문구 포함)
//  - 스톡 사진 7장은 어떤 빵집(예시 1~13번 · 카카오 빵집)에도 나오지 않아요
//  - 사진 주소가 깨졌을 때의 전환(onError)은 브라우저에서 따로 확인해요
// 실행: node supabase/tests/bakery-photo.test.mjs

import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const clean = (html) => html.replace(/<!-- -->/g, '')

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
const { RealBakeryPhotosContext } = await server.ssrLoadModule('/src/context/contexts.js')
const { getBakeryReviewPhoto } = await server.ssrLoadModule('/src/constants/bakeryPhotos.js')
const { default: BakeryPhoto } = await server.ssrLoadModule('/src/components/common/BakeryPhoto.jsx')

const render = (photosByBakeryId, props) =>
  clean(
    renderToString(
      h(ThemeProvider, { theme }, h(MemoryRouter, null, h(RealBakeryPhotosContext.Provider, { value: { photosByBakeryId } }, h(BakeryPhoto, props)))),
    ),
  )

const PLACEHOLDER_TEXT = '첫 번째 빵 사진을 기다리고 있어요!'

// ── 사진 고르기 ──
check('리뷰 사진이 있으면 그 사진을 돌려줘요', getBakeryReviewPhoto('7', { 7: 'https://cdn.test/a.jpg' }) === 'https://cdn.test/a.jpg')
check('리뷰 사진이 없으면 null (스톡 사진으로 채우지 않아요)', getBakeryReviewPhoto('7', {}) === null && getBakeryReviewPhoto(3, undefined) === null)

// ── 화면 ──
const withPhoto = render({ 5: 'data:image/jpeg;base64,AAAA' }, { bakeryId: 5, name: '밀창고' })
check('리뷰 사진이 있는 빵집: 그 사진을 보여줘요 (플레이스홀더 없음)', withPhoto.includes('src="data:image/jpeg;base64,AAAA"') && withPhoto.includes('alt="밀창고"') && !withPhoto.includes(PLACEHOLDER_TEXT))

const empty = render({}, { bakeryId: 99, name: '새빵집' })
check('사진이 없는 빵집: 빵 기사 플레이스홀더 + 문구', empty.includes(PLACEHOLDER_TEXT) && empty.includes('illust-knight-camera'))
check('플레이스홀더는 실제 사진이 아니라고 읽어줘요 (aria-label)', empty.includes('aria-label="새빵집: 아직 등록된 사진이 없어요"') && empty.includes('role="img"'))

let stockLeak = false
for (const id of [...Array.from({ length: 13 }, (_, i) => i + 1), 'kakao-123', '9999']) {
  const html = render({}, { bakeryId: id, name: `빵집${id}` })
  if (html.includes('bakery-photo-') || !html.includes(PLACEHOLDER_TEXT)) stockLeak = true
}
check('예시 1~13번 · 카카오 빵집 모두 스톡 사진 없이 플레이스홀더', !stockLeak)

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
