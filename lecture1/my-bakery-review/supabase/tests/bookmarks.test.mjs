// 찜한 빵집(src/storage/bookmarkStore.js) 검증.
//  - 찜 / 해제, 숫자 id · 문자열 id 같은 빵집 취급, 최근 찜이 맨 앞, 원본 불변
//  - 소유자별(로컬 · 계정 · 손님) 분리, 200곳 한도(해제는 가능)
//  - 저장 → 다시 읽기(새로고침 유지), 깨진 저장값 · 이상한 모양 정리, 저장 실패는 오류로 알림
//  - 리뷰 · 방문 체크 · 프로필 저장값에는 손대지 않아요 (EXP · 도감 · 퀘스트 영향 없음)
//  - 카드 · 상세 · 마이페이지가 같은 목록(useBookmarks)을 쓰는지 소스 확인
// 서버(Supabase)는 쓰지 않아요. 실행: node supabase/tests/bookmarks.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(here, '../../src')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

// ── 가짜 브라우저 저장소 ──
const makeStorage = ({ failWrites = false, silentWrites = false } = {}) => {
  const data = new Map()
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new Error('QuotaExceededError')
      if (!silentWrites) data.set(key, String(value))
    },
    removeItem: (key) => data.delete(key),
  }
}
const listeners = new Set()
globalThis.window = {
  addEventListener: (type, fn) => type === 'storage' && listeners.add(fn),
  removeEventListener: (type, fn) => type === 'storage' && listeners.delete(fn),
}
globalThis.localStorage = makeStorage()

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const store = await server.ssrLoadModule('/src/storage/bookmarkStore.js')
const { RepositoryError } = await server.ssrLoadModule('/src/storage/localStore.js')
const { toggleBookmarkInStore, removeBookmarkFromStore, readBookmarkStore, writeBookmarkStore, normalizeBookmarkStore, subscribeBookmarkStore, BookmarkLimitError, MAX_BOOKMARKS, BOOKMARKS_STORAGE_KEY } = store

const NOW = new Date('2026-10-15T09:00:00Z')
const bread = { id: 8010849, name: '옵스 해운대점', districtLabel: '해운대', signatureMenu: '케이크', address: '부산 해운대구 중동1로 31', photoSlot: 3 }
const salt = { id: 'k-2', name: '소금빵공방', districtLabel: '서면' }

// 1) 찜 / 해제
{
  const first = toggleBookmarkInStore({}, 'local', bread, NOW)
  check('처음 누르면 찜돼요 (added: true)', first.added === true && first.store.local.length === 1)
  const item = first.store.local[0]
  check('id는 문자열로 저장돼요 (카카오 id는 문자열, 예시 빵집 id는 숫자라서 맞춰요)', item.id === '8010849')
  check('이름 · 지역 · 메뉴 · 주소 · 사진 번호 · 찜한 시각을 같이 저장해요 (빵집 목록을 못 불러와도 마이페이지에 보여요)',
    item.name === '옵스 해운대점' && item.districtLabel === '해운대' && item.signatureMenu === '케이크' && item.address.includes('중동1로') && item.photoSlot === 3 && item.savedAt === NOW.toISOString())
  const again = toggleBookmarkInStore(first.store, 'local', { ...bread, id: '8010849' }, NOW)
  check('다시 누르면 해제돼요 (숫자 id와 문자열 id는 같은 빵집이에요)', again.added === false && again.store.local.length === 0)
  const two = toggleBookmarkInStore(first.store, 'local', salt, NOW)
  check('최근에 찜한 빵집이 맨 앞이에요', two.store.local.map((i) => i.id).join() === 'k-2,8010849')
  check('원본 store는 바뀌지 않아요 (불변)', first.store.local.length === 1 && two.store !== first.store)
  const noSlot = toggleBookmarkInStore({}, 'local', { id: 1, name: '예시 빵집' }, NOW).store.local[0]
  check('사진 번호 · 지역이 없어도 저장돼요 (예시 빵집)', noSlot.photoSlot === null && noSlot.districtLabel === '' && noSlot.address === '')
}

// 2) 소유자 분리
{
  let s = toggleBookmarkInStore({}, 'local', bread, NOW).store
  s = toggleBookmarkInStore(s, 'account:u1', salt, NOW).store
  check('로컬 · 계정 · 손님 목록이 서로 섞이지 않아요', s.local.length === 1 && s['account:u1'].length === 1 && (s['account:guest'] ?? []).length === 0)
  s = removeBookmarkFromStore(s, 'account:u1', 'k-2')
  check('해제는 그 소유자의 목록에서만 빠져요', s['account:u1'].length === 0 && s.local.length === 1)
  check('없는 빵집을 해제해도 오류 없이 그대로예요', removeBookmarkFromStore(s, 'local', 'nope').local.length === 1)
}

// 3) 200곳 한도
{
  let s = {}
  for (let i = 0; i < MAX_BOOKMARKS; i += 1) s = toggleBookmarkInStore(s, 'local', { id: `b${i}`, name: `빵집${i}` }, NOW).store
  let limitError = null
  try {
    toggleBookmarkInStore(s, 'local', { id: 'extra', name: '넘치는 빵집' }, NOW)
  } catch (error) {
    limitError = error
  }
  check(`${MAX_BOOKMARKS}곳이 차면 새 찜은 안내와 함께 막혀요`, limitError instanceof BookmarkLimitError && limitError.message.includes(String(MAX_BOOKMARKS)))
  check('가득 차도 이미 찜한 빵집은 해제할 수 있어요', toggleBookmarkInStore(s, 'local', { id: 'b0', name: '빵집0' }, NOW).added === false)
}

// 4) 저장 → 다시 읽기 (새로고침 유지)
{
  globalThis.localStorage = makeStorage()
  const s = toggleBookmarkInStore(toggleBookmarkInStore({}, 'local', bread, NOW).store, 'local', salt, NOW).store
  writeBookmarkStore(s)
  const reloaded = readBookmarkStore() // 새로고침 = 저장소에서 다시 읽기
  check('저장한 찜이 다시 읽어도 그대로예요 (새로고침 유지)', JSON.stringify(reloaded) === JSON.stringify(s))
  check('저장 키는 리뷰 · 방문 체크 · 프로필과 다른 전용 키예요', BOOKMARKS_STORAGE_KEY === 'my-bakery-review:v1:bookmarks' && globalThis.localStorage.data.size === 1)
}

// 5) 깨진 저장값 · 이상한 모양
{
  globalThis.localStorage = makeStorage()
  globalThis.localStorage.setItem(BOOKMARKS_STORAGE_KEY, '{깨진 json')
  check('깨진 저장값이어도 화면이 멈추지 않고 빈 목록이에요', JSON.stringify(readBookmarkStore()) === '{}')
  check('깨진 원본은 지우지 않고 백업 키로 보관해요', globalThis.localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}:corrupt-backup`) === '{깨진 json')
  check('배열 · 숫자 · null이 저장돼 있어도 빈 목록이에요', [[], 5, null, 'x'].every((v) => JSON.stringify(normalizeBookmarkStore(v)) === '{}'))
  const messy = normalizeBookmarkStore({
    local: [{ id: 1, name: '숫자 id' }, { id: '1', name: '중복 id' }, { name: 'id 없음' }, { id: 'x' }, null, 'str', { id: 'ok', name: ' 공백 정리 ', photoSlot: -1 }],
    other: 'not-array',
  })
  check('쓸 수 없는 항목(이름 · id 없음, 중복)은 걸러내고 나머지는 살려요', messy.local.map((i) => i.id).join() === '1,ok' && messy.other.length === 0)
  check('이름 앞뒤 공백을 정리하고 잘못된 사진 번호는 비워요', messy.local[1].name === '공백 정리' && messy.local[1].photoSlot === null)
  const longName = toggleBookmarkInStore({}, 'local', { id: 'long', name: 'ㄱ'.repeat(500) }, NOW).store.local[0].name
  check('너무 긴 이름은 100자로 잘라 저장해요', longName.length === 100)
}

// 6) 저장 실패는 성공한 척하지 않아요
{
  globalThis.localStorage = makeStorage({ failWrites: true })
  let error = null
  try {
    writeBookmarkStore({ local: [] })
  } catch (e) {
    error = e
  }
  check('저장 공간이 막혀 있으면 RepositoryError(STORAGE_FAILED)를 던져요', error instanceof RepositoryError && error.code === 'STORAGE_FAILED')
  globalThis.localStorage = makeStorage({ silentWrites: true })
  error = null
  try {
    writeBookmarkStore({ local: [] })
  } catch (e) {
    error = e
  }
  check('조용히 저장이 안 되는 브라우저도 다시 읽어 확인해서 오류로 알려요', error instanceof RepositoryError)
}

// 7) 리뷰 · 방문 · 프로필 저장값은 건드리지 않아요 (EXP · 도감 · 퀘스트는 저장된 리뷰로 계산)
{
  globalThis.localStorage = makeStorage()
  const others = {
    'my-bakery-review:v1:reviews': '[{"id":"r1","bakeryId":"8010849","rating":5}]',
    'my-bakery-review:visited-real-bakery-ids': '["8010849"]',
    'my-bakery-review:v1:profiles': '{"current":"u1"}',
  }
  for (const [k, v] of Object.entries(others)) globalThis.localStorage.setItem(k, v)
  let s = readBookmarkStore()
  s = toggleBookmarkInStore(s, 'local', bread, NOW).store
  writeBookmarkStore(s)
  s = toggleBookmarkInStore(s, 'local', bread, NOW).store
  writeBookmarkStore(s)
  check('찜 · 해제를 해도 리뷰 · 방문 체크 · 프로필 저장값은 한 글자도 바뀌지 않아요', Object.entries(others).every(([k, v]) => globalThis.localStorage.getItem(k) === v))
}

// 8) 다른 탭 동기화
{
  let calls = 0
  const off = subscribeBookmarkStore(() => (calls += 1))
  ;[...listeners].forEach((fn) => fn({ key: BOOKMARKS_STORAGE_KEY }))
  ;[...listeners].forEach((fn) => fn({ key: 'my-bakery-review:v1:reviews' }))
  check('다른 탭에서 찜이 바뀌면 알려줘요 (다른 키 변화는 무시)', calls === 1)
  off()
  ;[...listeners].forEach((fn) => fn({ key: BOOKMARKS_STORAGE_KEY }))
  check('구독을 풀면 더 이상 알려주지 않아요', calls === 1 && listeners.size === 0)
}

await server.close()

// 9) 소스 확인: 카드 · 상세 · 마이페이지가 같은 목록을 써요 (화면마다 따로 기억하지 않아요)
{
  const read = (f) => fs.readFileSync(path.join(srcDir, f), 'utf8').replace(/\r\n/g, '\n')
  const card = read('components/common/BakeryStageCard.jsx')
  const detail = read('pages/BakeryDetail.jsx')
  const list = read('components/mypage/BookmarkedBakeryList.jsx')
  const app = read('App.jsx')
  check('빵집 카드는 useBookmarks를 쓰고, 카드마다 따로 기억하던 useState는 없어요', card.includes('useBookmarks()') && !/useState/.test(card) && !card.includes('setBookmarked'))
  check('빵집 상세도 useBookmarks를 쓰고, 예전 bookmarkedIds 상태는 없어요', detail.includes('useBookmarks()') && !detail.includes('bookmarkedIds'))
  check('마이페이지 목록에서 찜 해제(removeBookmark)를 해요', list.includes('removeBookmark(row.id)'))
  check('BookmarksProvider가 앱 전체를 감싸요', app.includes('<BookmarksProvider>') && app.indexOf('<BookmarksProvider>') < app.indexOf('<HashRouter>'))
  check('찜 버튼에 눌림 상태(aria-pressed)와 빵집 이름이 들어간 이름표가 있어요', card.includes('aria-pressed={bookmarked}') && detail.includes('aria-pressed={bookmarked}'))
  const providerSrc = read('context/BookmarksContext.jsx')
  const storeSrc = read('storage/bookmarkStore.js')
  check('찜은 서버(Supabase) 클라이언트를 불러오지 않아요 (서버 변경 없음)', ![providerSrc, storeSrc, list].some((src) => /supabaseClient|getSupabase|createSupabase|from '@supabase/.test(src)))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
