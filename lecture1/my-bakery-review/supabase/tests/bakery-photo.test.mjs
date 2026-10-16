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
check('사진이 없는 빵집: 빵 기사 플레이스홀더(4종 중 하나) + 문구', empty.includes(PLACEHOLDER_TEXT) && /illust-knight-(camera|map|magnifier|book)/.test(empty))
check('플레이스홀더는 실제 사진이 아니라고 읽어줘요 (aria-label)', empty.includes('aria-label="새빵집: 아직 등록된 사진이 없어요"') && empty.includes('role="img"'))

let stockLeak = false
for (const id of [...Array.from({ length: 13 }, (_, i) => i + 1), 'kakao-123', '9999']) {
  const html = render({}, { bakeryId: id, name: `빵집${id}` })
  if (html.includes('bakery-photo-') || !html.includes(PLACEHOLDER_TEXT)) stockLeak = true
}
check('예시 1~13번 · 카카오 빵집 모두 스톡 사진 없이 플레이스홀더', !stockLeak)

// ── 플레이스홀더 포즈 4종: 빵집 ID로 고정 ──
const { PLACEHOLDER_POSES, getPlaceholderPose } = await server.ssrLoadModule('/src/constants/photoPlaceholders.js')
const FILE_BY_POSE = { knightCamera: 'illust-knight-camera', knightMap: 'illust-knight-map', knightMagnifier: 'illust-knight-magnifier', knightBook: 'illust-knight-book' }
const sampleIds = [...Array.from({ length: 13 }, (_, i) => i + 1), '8010849', '1369632308', '1463332224', '309768116', '23279005', 'kakao-1']

check('포즈는 카메라 · 지도 · 돋보기 · 책 4종', JSON.stringify(PLACEHOLDER_POSES) === JSON.stringify(['knightCamera', 'knightMap', 'knightMagnifier', 'knightBook']))
check('같은 빵집은 숫자 · 문자열 ID 모두 같은 포즈', getPlaceholderPose(7) === getPlaceholderPose('7') && getPlaceholderPose('8010849') === getPlaceholderPose('8010849'))
check('샘플 빵집들에 4종이 모두 골고루 나와요', new Set(sampleIds.map(getPlaceholderPose)).size === 4)

let poseMismatch = false
for (const id of sampleIds) {
  const pose = getPlaceholderPose(id)
  const first = render({}, { bakeryId: id, name: `빵집${id}` })
  const second = render({}, { bakeryId: id, name: `빵집${id}` })
  const others = Object.entries(FILE_BY_POSE).filter(([p]) => p !== pose).map(([, file]) => file)
  // 화면에는 그 빵집의 포즈 그림만 나오고(다른 포즈 없음), 문구도 항상 나오고, 다시 그려도 똑같아요
  if (!first.includes(FILE_BY_POSE[pose]) || others.some((file) => first.includes(file)) || !first.includes(PLACEHOLDER_TEXT) || first !== second) poseMismatch = true
}
check('빵집마다 정해진 포즈 그림 + "첫 번째 빵 사진을 기다리고 있어요!" 문구, 다시 그려도 동일', !poseMismatch)

const photoWins = render({ 8010849: 'data:image/jpeg;base64,BBBB' }, { bakeryId: '8010849', name: '옵스 해운대점' })
check('리뷰 사진이 있으면 어떤 포즈여도 사진이 우선 (플레이스홀더 그림 없음)', photoWins.includes('data:image/jpeg;base64,BBBB') && !Object.values(FILE_BY_POSE).some((file) => photoWins.includes(file)))

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
