// 게시글 사진 화면 · 준비 로직 검증 (브라우저 없이 서버 렌더링 + 로직 시험).
//  - 사진 선택 칸, 업로드 실패 선택 안내, 남은 파일 안내, 목록 썸네일(사진 있음/없음)
//  - 사진 준비: 항상 JPEG 800px, 1MB 넘으면 품질을 낮춰 재시도, 형식 · 읽기 오류 안내
//  - 모바일 터치 영역(버튼 높이 44px 이상)
// 실행: node supabase/tests/community-photo-ui.test.mjs

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
const wrap = (node) => clean(renderToString(h(ThemeProvider, { theme }, h(MemoryRouter, null, node))))

// ── 사진 준비 로직 ──
{
  const { preparePostPhoto } = await server.ssrLoadModule('/src/utils/preparePostPhoto.js')
  const jpeg = (bytes) => `data:image/jpeg;base64,${Buffer.alloc(bytes, 1).toString('base64')}`
  const file = { type: 'image/png', name: 'x.png' }
  const attempts = []
  const resizeSmall = async (f, options) => (attempts.push(options), jpeg(200 * 1024))
  const ok = await preparePostPhoto(file, resizeSmall)
  check('작은 사진: 한 번에 준비 (800px, 품질 0.8의 JPEG)', ok.startsWith('data:image/jpeg') && attempts.length === 1 && attempts[0].maxSize === 800 && attempts[0].quality === 0.8)

  attempts.length = 0
  const resizeBigThenSmall = async (f, options) => (attempts.push(options), attempts.length === 1 ? jpeg(1048576 + 5000) : jpeg(500 * 1024))
  const second = await preparePostPhoto(file, resizeBigThenSmall)
  check('1MB를 넘으면 품질을 낮춰 다시 줄여요 (0.8 -> 0.6)', second.startsWith('data:image/jpeg') && attempts.length === 2 && attempts[1].quality === 0.6 && attempts[1].maxSize === 800)

  attempts.length = 0
  const alwaysBig = async (f, options) => (attempts.push(options), jpeg(2 * 1048576))
  const tooBig = await preparePostPhoto(file, alwaysBig).catch((e) => e)
  check('끝까지 1MB를 넘으면 3번 시도 후 이유를 알려요 (640px, 품질 0.5까지)', tooBig instanceof Error && tooBig.message.includes('1MB') && attempts.length === 3 && attempts[2].maxSize === 640 && attempts[2].quality === 0.5)

  const notImage = await preparePostPhoto({ type: 'application/pdf' }, resizeSmall).catch((e) => e)
  check('사진이 아닌 파일은 거절', notImage instanceof Error && notImage.message.includes('사진 파일'))
  const noFile = await preparePostPhoto(null, resizeSmall).catch((e) => e)
  check('파일이 없으면 거절', noFile instanceof Error)
  const broken = await preparePostPhoto(file, async () => {
    throw new Error('이미지를 읽을 수 없어요.')
  }).catch((e) => e)
  check('사진을 읽지 못하면 다른 사진을 고르라고 안내', broken instanceof Error && broken.message.includes('다른 사진'))
  const badFormat = await preparePostPhoto(file, async () => `data:image/png;base64,${Buffer.alloc(100).toString('base64')}`).catch((e) => e)
  check('줄인 결과가 JPEG/WebP가 아니면(형식 문제) 크기가 아니라 형식 오류로 안내', badFormat instanceof Error && badFormat.message.includes('형식'))
}

// ── 서버에 보낼 사진 값 (글쓰기 / 고치기) ──
{
  const { resolvePhotoValue } = await server.ssrLoadModule('/src/utils/postPhotoValue.js')
  const photo = 'data:image/jpeg;base64,AAAA'
  check('글쓰기: 사진을 골랐으면 그 사진', resolvePhotoValue({ mode: 'write', newPhoto: photo }) === photo)
  check('글쓰기: 사진을 안 골랐으면 사진 없음(null)', resolvePhotoValue({ mode: 'write', newPhoto: null }) === null)
  check('글쓰기: 사진 올리기에 실패해 "사진 없이 글만 저장"을 고르면 null', resolvePhotoValue({ mode: 'write', newPhoto: photo, skipPhoto: true }) === null)
  check('고치기: 아무것도 안 바꾸면 undefined(사진 그대로)', resolvePhotoValue({ mode: 'edit', newPhoto: null }) === undefined)
  check('고치기: 새 사진을 고르면 교체', resolvePhotoValue({ mode: 'edit', newPhoto: photo }) === photo)
  check('고치기: 기존 사진을 빼면 null(빼기)', resolvePhotoValue({ mode: 'edit', newPhoto: null, removeExisting: true }) === null)
  check('고치기: 새 사진을 골랐다가 뺐으면 기존 사진 그대로(undefined)', resolvePhotoValue({ mode: 'edit', newPhoto: null, removeExisting: false }) === undefined)
  check('고치기: 교체하려다 실패해 "사진은 그대로 두고 글만 고치기"를 고르면 undefined(기존 사진 유지)', resolvePhotoValue({ mode: 'edit', newPhoto: photo, skipPhoto: true }) === undefined)
  check('고치기: 기존 사진을 빼려고 했어도 건너뛰기를 고르면 기존 사진 유지(undefined)', resolvePhotoValue({ mode: 'edit', newPhoto: null, removeExisting: true, skipPhoto: true }) === undefined)
}

// ── 사진 선택 칸 ──
{
  const Picker = (await server.ssrLoadModule('/src/components/community/PostPhotoPicker.jsx')).default
  const none = wrap(h(Picker, { previewUrl: null, onPick: () => {}, onRemove: () => {} }))
  check('사진이 없으면 [사진 붙이기]만 보여요 (선택 · 1장)', none.includes('사진 붙이기') && none.includes('(선택 · 1장)') && !none.includes('사진 빼기') && !none.includes('붙인 사진 미리보기'))
  check('안내: 800px로 줄여서 올림 · JPEG/WebP 1MB 이하 · 모두에게 공개', none.includes('800px') && none.includes('JPEG') && none.includes('1MB 이하') && none.includes('모두에게 공개'))
  const withPhoto = wrap(h(Picker, { previewUrl: 'https://cdn.test/photos/me/p.jpg', onPick: () => {}, onRemove: () => {} }))
  check('사진이 있으면 미리보기 + [사진 바꾸기] [사진 빼기]', withPhoto.includes('붙인 사진 미리보기') && withPhoto.includes('https://cdn.test/photos/me/p.jpg') && withPhoto.includes('사진 바꾸기') && withPhoto.includes('사진 빼기'))
  const busy = wrap(h(Picker, { previewUrl: null, busy: true, onPick: () => {}, onRemove: () => {} }))
  check('사진을 줄이는 동안에는 "사진 준비 중…"이고 버튼이 잠겨요', busy.includes('사진 준비 중…') && busy.includes('aria-disabled="true"'))
  const failed = wrap(h(Picker, { previewUrl: null, errorMessage: '사진이 너무 커서 줄여도 1MB를 넘어요. 다른 사진을 골라 주세요.', onPick: () => {}, onRemove: () => {} }))
  check('사진을 고르지 못한 이유를 알려줘요 (쓰던 글은 그대로)', failed.includes('role="alert"') && failed.includes('줄여도 1MB를 넘어요'))
  check('파일 선택은 카메라/사진첩이 열리는 image/* 이에요', none.includes('accept="image/*"'))
  check('모바일 터치 영역: 사진 버튼 높이 44px', none.includes('min-height:44px') || none.includes('min-height: 44px'))
}

// ── 업로드 실패 선택 안내 ──
{
  const Notice = (await server.ssrLoadModule('/src/components/community/PhotoUploadFailedNotice.jsx')).default
  const message = '사진을 올리지 못했어요. 작성한 글은 그대로 남아 있어요. 다시 시도하거나, 사진 없이 글만 저장할 수 있어요.'
  const write = wrap(h(Notice, { message, mode: 'write', onRetry: () => {}, onSkipPhoto: () => {} }))
  check('글쓰기: 안내 + [다시 시도] + [사진 없이 글만 저장]', write.includes('작성한 글은 그대로 남아 있어요') && write.includes('다시 시도') && write.includes('사진 없이 글만 저장'))
  const edit = wrap(h(Notice, { message, mode: 'edit', onRetry: () => {}, onSkipPhoto: () => {} }))
  check('고치기: [사진은 그대로 두고 글만 고치기]', edit.includes('>사진은 그대로 두고 글만 고치기<') && !edit.includes('>사진 없이 글만 저장<') && write.includes('>사진 없이 글만 저장<'))
  const busy = wrap(h(Notice, { message, busy: true, onRetry: () => {}, onSkipPhoto: () => {} }))
  check('저장 중에는 두 버튼 모두 잠겨요 (두 번 저장 방지)', (busy.match(/disabled=""/g) ?? []).length === 2)
  check('모바일 터치 영역: 버튼 높이 44px', write.includes('min-height:44px') || write.includes('min-height: 44px'))
}

// ── 남은 파일 안내 ──
{
  const Notice = (await server.ssrLoadModule('/src/components/community/LeftoverPhotosNotice.jsx')).default
  check('남은 파일이 없으면 아무것도 안 보여요', !wrap(h(Notice, { items: [], onRetry: () => {} })).includes('다시 정리하기'))
  const html = wrap(h(Notice, { items: [{ path: 'me/a.jpg' }, { path: 'me/b.jpg' }], onRetry: () => {} }))
  check('남은 파일 개수와 경로(파일 이름)를 보여줘요', html.includes('사진 파일 2개') && html.includes('me/a.jpg') && html.includes('me/b.jpg') && html.includes('서버에서 지우지 못했어요'))
  check('[다시 정리하기] 버튼 (정리 중에는 잠김)', html.includes('다시 정리하기') && wrap(h(Notice, { items: [{ path: 'me/a.jpg' }], busy: true, onRetry: () => {} })).includes('정리 중…'))
}

// ── 목록 썸네일 ──
{
  const Item = (await server.ssrLoadModule('/src/components/common/CommunityPostListItem.jsx')).default
  const base = { id: 'p1', categoryLabel: '빵사진 자랑', title: '제목', author: '글쓴이', authorLevel: null, content: '내용', heartCount: 1, commentCount: 2, createdAt: '2026-10-14' }
  const withPhoto = wrap(h(Item, { ...base, photoUrl: 'https://cdn.test/photos/u/p.jpg', placeholderEmoji: '📸' }))
  check('사진이 있는 글: 썸네일에 그 사진을 써요', withPhoto.includes('src="https://cdn.test/photos/u/p.jpg"') && withPhoto.includes('loading="lazy"') && !withPhoto.includes('>📸<'))
  const without = wrap(h(Item, { ...base, photoUrl: null, placeholderEmoji: '📸' }))
  check('사진이 없는 글: 기존 이모지 아치 그대로', without.includes('📸') && !without.includes('<img'))
  const sample = wrap(h(Item, { ...base, photoBakeryId: 1, isSample: true }))
  check('예시 글(로컬 모드): 기존 예시 사진 + "예시" 표시 그대로', sample.includes('<img') && sample.includes('예시'))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
