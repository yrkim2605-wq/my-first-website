// 로컬 기록 가져오기 화면 문구 검증 (브라우저 없이 서버 렌더링으로 확인).
//  - 미리보기: 날짜 안내 · 원본 보존 · EXP 규칙 · 이전 가능 / 불가 이유 · 사진 안내 · 짧은 일지 고치기
//  - 결과: 성공 / 사진 없이 성공 / 이미 있음 / 실패 / 시도 못 함 구분, 멈춘 이유
//  - 카드: 계정 모드 + 로그인 + 남은 기록이 있을 때만 보여요 (다른 계정에는 이전 완료 표시가 적용되지 않아요)
// 실행: node supabase/tests/local-import-ui.test.mjs

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

const accountEnv = {
  'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('supabase'),
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fake.supabase.test'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fake_for_ui_test'),
}
const clean = (html) => html.replace(/<!-- -->/g, '')
const ENOUGH = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
const jpeg = (bytes) => `data:image/jpeg;base64,${Buffer.alloc(bytes, 1).toString('base64')}`
const review = (id, bakeryId, over = {}) => ({ id, userId: 'local-u1', authorNickname: '임시닉', bakeryId: String(bakeryId), bakerySource: 'kakao', bakeryName: `빵집${bakeryId}`, districtId: 'seomyeon', rating: 4.5, content: ENOUGH, photo: null, createdAt: '2026-01-01T00:00:00.000Z', ...over })
const info = (id) => [String(id), { id: String(id), name: `빵집${id}`, districtId: 'seomyeon', address: '부산', lat: 35.1, lng: 129 }]

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', define: accountEnv })
const lib = await server.ssrLoadModule('/src/migration/localImport.js')
const preview = await server.ssrLoadModule('/src/components/mypage/LocalImportPreview.jsx')
const { default: theme } = await server.ssrLoadModule('/src/theme.js')
const wrap = (node) => renderToString(h(ThemeProvider, { theme }, h(MemoryRouter, null, node)))

// ── 미리보기 ──
{
  const snapshot = {
    profiles: [{ userId: 'local-u1', nickname: '임시닉' }],
    reviews: [
      review('ok', 1001, { photo: jpeg(2000) }),
      review('sample', 5, { bakerySource: 'sample', bakeryName: '예시빵집' }),
      review('existing', 1002),
      review('nobakery', 1003),
      review('short', 1004, { content: '짧은 일지' }),
      review('bigphoto', 1007, { photo: jpeg(lib.PHOTO_MAX_BYTES + 5000) }),
    ],
    visitedIds: ['1001', '1002', '7'],
  }
  const bakeryInfoById = new Map([info(1001), info(1002), info(1004), info(1007)])
  const plan = lib.buildImportPlan({ snapshot, account: { reviewBakeryIds: new Set(['1002']), visitBakeryIds: new Set(['1002']) }, registeredIds: new Set(), bakeryInfoById, state: { items: {} } })
  const selectedKeys = ['review:ok', 'review:bigphoto', 'visit:1001']
  const items = lib.toImportItems(plan, selectedKeys, bakeryInfoById)
  const simulation = lib.simulateImportExp({ accountReviews: [], items, settings: { dailyExpCap: 100, reviewExp: 30, photoExp: 10 } })
  const html = clean(wrap(h(preview.ImportPreview, { plan, selectedKeys, onToggle: () => {}, onEdit: () => {}, simulation })))

  check('안내: 작성 날짜는 서버 저장 날짜로 기록된다는 문구', html.includes('원래 날짜가 아니라') && html.includes('가져오는 때의 서버 저장 날짜'))
  check('안내: 이 브라우저의 기록은 지우지 않고 계정 기록은 덮어쓰지 않는다는 문구', html.includes('지우지 않고 그대로 남아요') && html.includes('덮어쓰지 않아요'))
  check('안내: EXP는 서버 규칙 그대로 (하루 100 · 일지 20개)', html.includes('서버 규칙 그대로') && html.includes('하루 100까지') && html.includes('20개까지'))
  check('이전 불가 이유: 예시 빵집', html.includes('이전 불가 · 예시 빵집') && html.includes('예시 빵집의 일지라서 이전할 수 없어요'))
  check('이전 불가 이유: 빵집 정보 필요', html.includes('이전 불가 · 빵집 정보 필요') && html.includes('빵집 위치 정보를 지금 불러오지 못했어요'))
  check('계정에 이미 있는 일지는 덮어쓰지 않고 건너뛴다고 표시', html.includes('이미 계정에 있음') && html.includes('내 계정에 이미 일지가 있어서 건너뛰어요 (덮어쓰지 않아요)'))
  check('사진: 큰 사진은 제외되고 글만 가져온다는 이유(1MB)', html.includes('사진은 제외') && html.includes('1MB') && html.includes('글만 가져와요'))
  check('사진: 가능한 사진은 "사진 포함"', html.includes('사진 포함'))
  check('짧은 일지: 고쳐 쓰는 입력창 + "조금만 더 자세히 적어주세요! (N자 남음)" + 글자 수', html.includes('수정 필요') && html.includes('조금만 더 자세히 적어주세요! (16자 남음)') && html.includes('/500') && html.includes('일지 내용 고쳐 쓰기'))
  check('요약 숫자와 EXP 예상(오늘 저장 · EXP 대상 · 예상 EXP)', html.includes('이전 가능 일지') && html.includes('예상 결과') && html.includes('EXP를 받는 일지') && html.includes('예상 EXP'))
  check('다녀왔어요 체크 섹션과 이미 체크됨 · 예시 이유', html.includes('다녀왔어요 체크') && html.includes('이미 내 계정에 체크돼 있어요') && html.includes('예시 빵집이라서 이전할 수 없어요'))
  // 체크박스: 이전 가능만 선택 가능, 나머지는 비활성
  const boxes = html.match(/<input[^>]*type="checkbox"[^>]*>/g) ?? []
  const disabledBoxes = boxes.filter((b) => b.includes('disabled')).length
  check('체크박스에 접근성 이름(aria-label)이 붙어요', html.includes('aria-label="빵집1001 일지 가져오기"') && html.includes('aria-label="빵집1001 다녀왔어요 체크 가져오기"'))
  check('체크박스는 이전 가능한 항목만 활성화 (나머지는 비활성)', boxes.length === 9 && disabledBoxes === 6, `${boxes.length}개 중 비활성 ${disabledBoxes}`)

  // 20자 이상으로 고쳐 쓰면 입력창은 그대로 두고 "이전할 수 있어요!"
  const edited = lib.buildImportPlan({ snapshot, account: { reviewBakeryIds: new Set(), visitBakeryIds: new Set() }, registeredIds: new Set(), bakeryInfoById, state: { items: {} }, edits: { short: ENOUGH } })
  const editedHtml = clean(wrap(h(preview.ImportPreview, { plan: edited, selectedKeys: ['review:short'], onToggle: () => {}, onEdit: () => {}, simulation: null })))
  check('고쳐 쓴 일지: 입력창이 사라지지 않고 "이전할 수 있어요!"', editedHtml.includes('이전할 수 있어요!') && editedHtml.includes('일지 내용 고쳐 쓰기'))

  const done = lib.buildImportPlan({ snapshot, account: { reviewBakeryIds: new Set(), visitBakeryIds: new Set() }, registeredIds: new Set(), bakeryInfoById, state: { items: { 'review:ok': { status: 'done' }, 'visit:1001': { status: 'done' } } } })
  const doneHtml = clean(wrap(h(preview.ImportPreview, { plan: done, selectedKeys: [], onToggle: () => {}, onEdit: () => {}, simulation: null })))
  check('이미 이전한 항목은 목록에서 빠지고 "이전 완료 N개"로만 표시', !doneHtml.includes('review:ok') && doneHtml.includes('이전 완료') && !doneHtml.includes('빵집1001 일지 가져오기'))
}

// ── 결과 ──
{
  const results = [
    { key: 'a', kind: 'review', label: '빵집A', status: 'success' },
    { key: 'b', kind: 'review', label: '빵집B', status: 'success_no_photo', message: '사진이 1.5MB라서 서버 저장소 제한(1MB)을 넘어 글만 가져와요' },
    { key: 'c', kind: 'review', label: '빵집C', status: 'existing', message: '이미 계정에 있어서 건너뛰었어요' },
    { key: 'd', kind: 'review', label: '빵집D', status: 'failed', message: '이 빵집은 확인하지 못했어요.' },
    { key: 'e', kind: 'visit', label: '빵집E', status: 'not_attempted', message: '아직 시도하지 않았어요' },
  ]
  const summary = lib.summarizeResults(results)
  const html = clean(wrap(h(preview.ImportResult, { results, summary, stopped: { reason: 'daily_limit', message: lib.STOP_REASON_TEXT.daily_limit } })))
  check('결과 요약: 성공 2(사진 없이 1) · 건너뜀 1 · 실패 1 · 시도 못 함 1', summary.success === 2 && summary.noPhoto === 1 && summary.existing === 1 && summary.failed === 1 && summary.notAttempted === 1)
  check('결과 화면: 항목별로 성공 / 사진 없이 / 이미 있음 / 실패 / 시도 못 함이 구분돼요', ['성공', '성공 (사진 없이)', '이미 있어서 건너뜀', '실패', '시도 못 함'].every((label) => html.includes(label)))
  check('결과 화면: 멈춘 이유와 "이어서 가져올 수 있어요" 안내, 원본 보존 안내', html.includes('멈춘 이유') && html.includes('내일 이어서') && html.includes('이어서 가져올 수 있어요') && html.includes('원본은 그대로'))
  const progress = clean(wrap(h(preview.ImportProgress, { index: 1, total: 4, item: { label: '빵집B' } })))
  check('진행 화면: n / 전체와 현재 항목', progress.includes('2 / 4') && progress.includes('빵집B'))
}

// ── 카드: 언제 보이는지 ──
{
  const store = {}
  globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] }
  const { ProfileContext, ReviewsContext } = await server.ssrLoadModule('/src/context/contexts.js')
  const { BusanBakeriesProvider } = await server.ssrLoadModule('/src/context/BusanBakeriesContext.jsx')
  const { VisitedBakeriesProvider } = await server.ssrLoadModule('/src/context/VisitedBakeriesContext.jsx')
  const { default: Card } = await server.ssrLoadModule('/src/components/mypage/LocalImportCard.jsx')
  const renderCard = (profile) =>
    clean(
      renderToString(
        h(ThemeProvider, { theme }, h(MemoryRouter, null,
          h(ProfileContext.Provider, { value: { profile, ready: true } },
            h(ReviewsContext.Provider, { value: { reviews: [], loaded: true, loadedUserId: profile?.userId ?? null, loadError: null, gameSettings: null, reload: async () => {} } },
              h(BusanBakeriesProvider, null, h(VisitedBakeriesProvider, null, h(Card)))))),
        ),
      ),
    )
  const ME = { userId: 'acc-A', nickname: '계정A', createdAt: '2026-10-14T00:00:00Z' }
  const OTHER = { userId: 'acc-B', nickname: '계정B', createdAt: '2026-10-14T00:00:00Z' }

  check('로컬 기록이 없으면 카드가 보이지 않아요', !renderCard(ME).includes('가져올 기록 확인하기'))
  store['my-bakery-review:v1:reviews'] = JSON.stringify({ version: 1, reviews: [review('r1', 1001), review('r2', 1002)] })
  store['my-bakery-review:visited-real-bakery-ids'] = JSON.stringify(['1001'])
  const shown = renderCard(ME)
  check('남은 기록이 있으면 카드: 개수 + 확인 화면만 열린다는 안내 + 원본 보존 안내', shown.includes('가져올 기록 확인하기') && shown.includes('모험 일지 <b>2</b>개') && shown.includes('다녀왔어요 체크 <b>1</b>곳') && shown.includes('서버에 아무것도 저장하지 않고') && shown.includes('지우지 않아요'), shown.slice(0, 200))
  check('로그아웃 상태에서는 카드가 보이지 않아요', !renderCard(null).includes('가져올 기록 확인하기'))

  // 계정 A에서 모두 이전 완료로 표시 → A에서는 카드가 사라지고, 계정 B에서는 그대로 보여요
  store['my-bakery-review:v1:import-state:acc-A'] = JSON.stringify({ version: 1, accountUserId: 'acc-A', items: { 'review:r1': { status: 'done' }, 'review:r2': { status: 'done' }, 'visit:1001': { status: 'done' } } })
  check('모두 이전한 계정(A)에서는 카드가 사라져요', !renderCard(ME).includes('가져올 기록 확인하기'))
  check('다른 계정(B)에서는 A의 이전 완료 표시가 적용되지 않아 카드가 그대로 보여요', renderCard(OTHER).includes('가져올 기록 확인하기') && renderCard(OTHER).includes('모험 일지 <b>2</b>개'))
  store['my-bakery-review:v1:import-state:acc-A'] = JSON.stringify({ version: 1, accountUserId: 'acc-A', items: { 'review:r1': { status: 'done' } } })
  check('일부만 이전했다면 남은 개수만 보여줘요 (일지 1개 · 체크 1곳)', renderCard(ME).includes('모험 일지 <b>1</b>개') && renderCard(ME).includes('다녀왔어요 체크 <b>1</b>곳'))
}

// ── 로컬 모드에서는 카드가 없어요 ──
{
  const localServer = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', define: { 'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('local') } })
  const { ProfileContext, ReviewsContext } = await localServer.ssrLoadModule('/src/context/contexts.js')
  const { BusanBakeriesProvider } = await localServer.ssrLoadModule('/src/context/BusanBakeriesContext.jsx')
  const { VisitedBakeriesProvider } = await localServer.ssrLoadModule('/src/context/VisitedBakeriesContext.jsx')
  const { default: Card } = await localServer.ssrLoadModule('/src/components/mypage/LocalImportCard.jsx')
  const { default: localTheme } = await localServer.ssrLoadModule('/src/theme.js')
  const html = renderToString(
    h(ThemeProvider, { theme: localTheme }, h(MemoryRouter, null,
      h(ProfileContext.Provider, { value: { profile: { userId: 'acc-A', nickname: 'A' }, ready: true } },
        h(ReviewsContext.Provider, { value: { reviews: [], loaded: true, loadedUserId: 'acc-A', loadError: null, gameSettings: null, reload: async () => {} } },
          h(BusanBakeriesProvider, null, h(VisitedBakeriesProvider, null, h(Card)))))),
    ),
  )
  check('로컬 모드에서는 가져오기 카드가 나오지 않아요', !html.includes('가져올 기록'))
  await localServer.close()
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
