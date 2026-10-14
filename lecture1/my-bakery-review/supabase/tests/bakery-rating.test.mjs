// 빵집 평균 별점 · 리뷰 개수 검증.
//  1) 서버 집계(ranking_bakeries): 여러 리뷰의 평균, 수정 · 삭제 후 재계산, 다른 사용자 리뷰 반영, 리뷰 0개는 없음, 소수점 첫째 자리
//  2) 화면 계산(src/utils/bakeryRating.js) = 서버 계산 (손으로 고른 경계값 + 무작위)
//  3) 저장소(listRatingStats): 1000줄 넘게 나눠 받기, 오류 처리
//  4) 화면: 상세 · 목록 카드 · 지도 카드가 같은 숫자를 보여주는지, 리뷰 0개는 "아직 별점이 없어요", 로컬 모드는 예전 그대로
// PGlite(진짜 Postgres)로 실행해요.   실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/bakery-rating.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)
const { averageOfReviews, getBakeryRatingInfo, formatAverage } = await import(pathToFileURL(path.join(here, '../../src/utils/bakeryRating.js')).href)

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

// ── 1. 서버 집계 ──
const sql = (file) => fs.readFileSync(path.join(here, file), 'utf8')
const db = new PGlite()
await db.exec(sql('supabase_stub.sql'))
for (const file of ['0001_schema', '0002_rls', '0004_community', '0005_rankings', '0006_review_content', '0007_service_role_grants']) await db.exec(sql(`../migrations/${file}.sql`))

const as = (userId) => ({
  async q(text, params = []) {
    await db.exec(`reset role; ${userId ? `set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);` : `set role anon; select set_config('request.jwt.claim.sub', '', false);`}`)
    try {
      return { rows: (await db.query(text, params)).rows, error: null }
    } catch (error) {
      return { rows: [], error }
    } finally {
      await db.exec('reset role')
    }
  },
})
const admin = async (text, params = []) => (await db.query(text, params)).rows

const users = Array.from({ length: 9 }, (_, i) => `00000000-0000-0000-0000-0000000002${String(i + 1).padStart(2, '0')}`)
for (const [i, id] of users.entries()) await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3)`, [id, `r${i}@test.dev`, JSON.stringify({ nickname: `평점${i + 1}` })])
for (let i = 1; i <= 40; i += 1) await admin(`insert into public.bakeries (id, name, district_id) values ($1, $2, $3)`, [`k${i}`, `테스트빵집${i}`, ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae'][i % 5]])

const ENOUGH = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
const rate = (userIndex, bakery, rating) => as(users[userIndex]).q(`insert into public.reviews (bakery_id, rating, content) values ($1, $2, $3) returning id`, [bakery, rating, ENOUGH])
const stat = async (bakery, who = null) => (await as(who).q(`select review_count::int n, avg_rating::float avg from public.ranking_bakeries where bakery_id = $1`, [bakery])).rows[0] ?? null

// 손으로 고른 경계값 (소수점 첫째 자리 반올림: 4.25 -> 4.3 같은 .x5 경계 포함)
const handmade = {
  k1: [4.5, 4], // 4.25 -> 4.3
  k2: [5, 4, 4], // 4.333 -> 4.3
  k3: [4.5], // 4.5
  k4: [3.5, 4], // 3.75 -> 3.8
  k5: [1, 1, 1.5], // 1.1667 -> 1.2
  k6: [0.5, 0.5, 0.5, 1], // 0.625 -> 0.6
  k7: [5, 5, 5], // 5.0
  k8: [2.5, 3, 3, 2], // 2.625 -> 2.6
}
const expectedHandmade = { k1: [4.3, 2], k2: [4.3, 3], k3: [4.5, 1], k4: [3.8, 2], k5: [1.2, 3], k6: [0.6, 4], k7: [5, 3], k8: [2.6, 4] }
for (const [bakery, ratings] of Object.entries(handmade)) for (const [i, rating] of ratings.entries()) await rate(i, bakery, rating)

for (const [bakery, [average, count]] of Object.entries(expectedHandmade)) {
  const s = await stat(bakery)
  check(`서버 집계 ${bakery}: 별점 ${handmade[bakery].join(', ')} -> 평균 ${average.toFixed(1)}, ${count}개`, s?.avg === average && s.n === count, JSON.stringify(s))
}
check('리뷰가 0개인 빵집은 집계에 없어요 (0점으로 나오지 않아요)', (await stat('k30')) === null)
check('평균은 소수점 첫째 자리까지만 (4.333… -> 4.3)', (await stat('k2')).avg === 4.3)
check('비로그인도 같은 집계를 읽어요 (다른 사용자들의 리뷰가 모두 반영됨)', JSON.stringify(await stat('k1', null)) === JSON.stringify(await stat('k1', users[0])))

// 화면 계산 = 서버 계산 (손으로 고른 경계값)
const asReviews = (bakery, ratings) => ratings.map((rating) => ({ bakeryId: bakery, rating }))
for (const [bakery, ratings] of Object.entries(handmade)) {
  const js = averageOfReviews(asReviews(bakery, ratings), bakery)
  const s = await stat(bakery)
  check(`화면 계산 = 서버 계산 ${bakery}`, js.average === s.avg && js.count === s.n, `${JSON.stringify(js)} vs ${JSON.stringify(s)}`)
}

// 무작위 시험: k11~k40의 서로 다른 사용자 수 · 별점
let seed = 20261014
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const perUserCount = new Array(users.length).fill(0)
const randomExpect = {}
for (let b = 11; b <= 40; b += 1) {
  const bakery = `k${b}`
  const n = 1 + Math.floor(random() * 9)
  const picked = [...users.keys()].sort(() => random() - 0.5).slice(0, n)
  const ratings = []
  for (const userIndex of picked) {
    if (perUserCount[userIndex] >= 9) continue // 하루 작성 한도(20개) 안에서 (손으로 고른 8개 + 흐름 시험 몫을 남겨요)
    const rating = (1 + Math.floor(random() * 10)) / 2
    const r = await rate(userIndex, bakery, rating)
    if (!r.error) {
      perUserCount[userIndex] += 1
      ratings.push(rating)
    }
  }
  randomExpect[bakery] = ratings
}
let mismatch = 0
let firstMismatch = ''
for (const [bakery, ratings] of Object.entries(randomExpect)) {
  const s = await stat(bakery)
  const js = averageOfReviews(asReviews(bakery, ratings), bakery)
  if (ratings.length === 0) {
    if (s !== null) mismatch += 1
    continue
  }
  if (!s || s.avg !== js.average || s.n !== js.count) {
    mismatch += 1
    if (!firstMismatch) firstMismatch = `${bakery} ${JSON.stringify(ratings)} 서버 ${JSON.stringify(s)} 화면 ${JSON.stringify(js)}`
  }
}
check(`화면 계산 = 서버 계산 (무작위 ${Object.keys(randomExpect).length}개 빵집 모두 일치)`, mismatch === 0, firstMismatch)

// 작성 -> 수정 -> 삭제 -> 다른 사용자: 같은 빵집(k35 대신 새 빵집)으로 순서대로 확인
await admin(`insert into public.bakeries (id, name, district_id) values ('flow', '흐름 시험 빵집', 'seomyeon')`)
const flow = []
const r1 = await rate(0, 'flow', 5)
flow.push(['A가 5점 작성', await stat('flow')])
const r2 = await rate(1, 'flow', 4)
flow.push(['B(다른 사용자)가 4점 작성', await stat('flow')])
const r3 = await rate(2, 'flow', 3)
flow.push(['C가 3점 작성', await stat('flow')])
await as(users[0]).q(`update public.reviews set rating = 3 where id = $1`, [r1.rows[0].id])
flow.push(['A가 5점 -> 3점으로 수정', await stat('flow')])
await as(users[1]).q(`delete from public.reviews where id = $1`, [r2.rows[0].id])
flow.push(['B가 자기 리뷰 삭제', await stat('flow')])
const expected = [
  ['A가 5점 작성', 5, 1],
  ['B(다른 사용자)가 4점 작성', 4.5, 2],
  ['C가 3점 작성', 4, 3],
  ['A가 5점 -> 3점으로 수정', 3.3, 3],
  ['B가 자기 리뷰 삭제', 3, 2],
]
for (const [i, [label, average, count]] of expected.entries()) {
  check(`즉시 재계산: ${label} -> 평균 ${average.toFixed(1)}, ${count}개`, flow[i][1]?.avg === average && flow[i][1]?.n === count, JSON.stringify(flow[i][1]))
}
check('다른 사용자의 리뷰를 내 화면(다른 계정)에서도 같은 값으로 읽어요', JSON.stringify(await stat('flow', users[5])) === JSON.stringify(await stat('flow', null)))
check('남의 리뷰 별점은 고칠 수 없어요 (평균이 바뀌지 않아요)', (await as(users[3]).q(`update public.reviews set rating = 0.5 where id = $1 returning id`, [r3.rows[0].id])).rows.length === 0 && (await stat('flow')).avg === 3)
await as(users[0]).q(`delete from public.reviews where bakery_id = 'flow'`)
await as(users[2]).q(`delete from public.reviews where bakery_id = 'flow'`)
check('모든 리뷰를 지우면 집계에서 사라져요 (리뷰 0개 = 별점 없음)', (await stat('flow')) === null)
const stored = await admin(`select rating::float r from public.reviews where bakery_id = 'k2' order by user_id`)
check('rating 값은 reviews 표에 입력한 그대로 저장돼요', JSON.stringify(stored.map((x) => x.r)) === JSON.stringify([5, 4, 4]))

// ── 2. 화면 계산 규칙 ──
{
  const stats = { 111: { average: 4.3, count: 3 } }
  const base = { isAccountMode: true, stats, statsStatus: 'ready', reviews: [], reviewsLoaded: true }
  const ready = getBakeryRatingInfo({ ...base, bakeryId: '111' })
  check('집계가 있으면 평균과 개수 (ready)', ready.status === 'ready' && ready.average === 4.3 && ready.count === 3 && ready.source === 'server')
  const none = getBakeryRatingInfo({ ...base, bakeryId: '222' })
  check('집계에 없는 빵집은 리뷰 0개 -> "empty" (0점이 아니에요)', none.status === 'empty' && none.count === 0)
  check('집계를 아직 못 불러왔으면 "loading"', getBakeryRatingInfo({ ...base, stats: null, statsStatus: 'loading', reviewsLoaded: false, bakeryId: '111' }).status === 'loading')
  const fallback = getBakeryRatingInfo({ ...base, stats: null, statsStatus: 'error', reviews: asReviews('111', [4.5, 4]), bakeryId: '111' })
  check('집계를 못 가져오면 불러온 리뷰로 대신 계산 (4.5, 4 -> 4.3)', fallback.status === 'ready' && fallback.average === 4.3 && fallback.count === 2 && fallback.source === 'loaded-reviews')
  const bothFailed = getBakeryRatingInfo({ ...base, stats: null, statsStatus: 'error', reviews: [], reviewsError: '서버에 연결하지 못했어요.', bakeryId: '111' })
  check('집계도 리뷰 목록도 실패하면 "리뷰 없음"이 아니라 "error" (0점 · 별점 없음으로 오해하지 않아요)', bothFailed.status === 'error' && bothFailed.count === 0)
  check('로컬 모드는 이 계산을 쓰지 않아요 ("off")', getBakeryRatingInfo({ ...base, isAccountMode: false, bakeryId: '111' }).status === 'off')
  check('한 자리 소수 문자열', formatAverage(4) === '4.0' && formatAverage(4.3) === '4.3' && formatAverage(5) === '5.0')
}

// ── 3. 저장소: listRatingStats ──
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  define: {
    'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('supabase'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://fake.supabase.test'),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_fake_for_ui_test'),
  },
})
const shared = await server.ssrLoadModule('/src/storage/supabaseShared.js')
shared.setDebugLogger(() => {})
const { createSupabaseReviewRepository } = await server.ssrLoadModule('/src/storage/supabaseReviewRepository.js')
{
  const rows = Array.from({ length: 2300 }, (_, i) => ({ bakery_id: String(1000 + i), review_count: (i % 5) + 1, avg_rating: ((i % 9) + 1) / 2 }))
  const log = []
  const makeClient = (failAt = null) => ({
    from: (table) => {
      const q = { table, order: null, range: null }
      const builder = {
        select: () => builder,
        order: (column, opts) => ((q.order = [column, opts?.ascending !== false]), builder),
        range: (from, to) => {
          q.range = [from, to]
          log.push({ table, order: q.order, range: [from, to] })
          if (failAt != null && log.length === failAt) return Promise.resolve({ data: null, error: { code: 'XX000', message: 'boom' } })
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null })
        },
      }
      return builder
    },
  })
  const repo = createSupabaseReviewRepository(async () => makeClient())
  const stats = await repo.listRatingStats()
  check('1000줄이 넘어도 나눠서 전부 가져와요 (2300줄 = 3번 요청)', Object.keys(stats).length === 2300 && log.length === 3 && log[0].range[0] === 0 && log[2].range[0] === 2000, `${Object.keys(stats).length}줄 ${log.length}번`)
  check('서버 뷰(ranking_bakeries)에서 빵집 ID 순으로 받아요', log.every((l) => l.table === 'ranking_bakeries' && l.order[0] === 'bakery_id' && l.order[1] === true))
  check('값을 { average, count }로 바꿔요', stats['1000'].count === 1 && stats['1000'].average === 0.5 && stats['1003'].count === 4 && typeof stats['1003'].average === 'number')
  log.length = 0
  const failing = createSupabaseReviewRepository(async () => makeClient(2))
  const error = await failing.listRatingStats().catch((e) => e)
  check('중간에 오류가 나면 일부만 쓰지 않고 오류로 알려요', error?.code === 'UNKNOWN' && error.debug?.step === 'read')
}

// ── 4. 화면: 같은 숫자, 0개 표시, 로컬 모드 그대로 ──
const clean = (html) => html.replace(/<!-- -->/g, '')
{
  const { default: theme } = await server.ssrLoadModule('/src/theme.js')
  const { ReviewsContext } = await server.ssrLoadModule('/src/context/contexts.js')
  const { RealBakeryPhotosProvider } = await server.ssrLoadModule('/src/context/RealBakeryPhotosContext.jsx')
  const Summary = (await server.ssrLoadModule('/src/components/bakery/BakeryRatingSummary.jsx')).default
  const StageCard = (await server.ssrLoadModule('/src/components/common/BakeryStageCard.jsx')).default
  const PreviewCard = (await server.ssrLoadModule('/src/components/home/BakeryMapPreviewCard.jsx')).default
  const { useBakeryRatings } = await server.ssrLoadModule('/src/hooks/useBakeryRatings.js')
  const wrap = (stats, node, statsStatus = 'ready') =>
    clean(
      renderToString(
        h(ThemeProvider, { theme }, h(MemoryRouter, null, h(ReviewsContext.Provider, { value: { reviews: [], loaded: true, ratingStats: stats, ratingStatsStatus: statsStatus } }, h(RealBakeryPhotosProvider, null, node)))),
      ),
    )
  const bakery = { id: '111', name: '시험 빵집', districtId: 'seomyeon', address: '부산', rating: 0, heartCount: 0, tags: [], signatureMenu: '', lat: 35, lng: 129 }
  const stats = { 111: { average: 4.3, count: 3 } }

  // 같은 hook에서 받은 값을 세 화면이 모두 보여줘요
  const Probe = ({ children }) => {
    const { getRating } = useBakeryRatings()
    return children(getRating('111'), getRating('999'))
  }
  const detail = wrap(stats, h(Probe, null, (info) => h(Summary, { info })))
  const card = wrap(stats, h(Probe, null, (info) => h(StageCard, { ...bakery, id: 111, rating: info.average, reviewCount: info.count, ratingStatus: info.status, districtLabel: '서면' })))
  const preview = wrap(stats, h(PreviewCard, { bakery, isSelected: true, variant: 'overlay' }))
  check('상세 페이지: 평균 4.3 + 리뷰 3개 + 접근성 이름', detail.includes('>4.3<') && detail.includes('(리뷰 3개)') && detail.includes('평균 별점 4.3점, 리뷰 3개'), detail.slice(0, 300))
  check('목록 카드: 같은 평균 4.3과 리뷰 3개', card.includes('>4.3<') && card.includes('>3<'))
  check('지도 미리보기 카드: 같은 평균 4.3 (리뷰 3개)', preview.includes('>4.3<') && preview.includes('(3)'))

  // 리뷰 0개
  const emptyDetail = wrap({}, h(Probe, null, (info) => h(Summary, { info })))
  check('리뷰 0개(상세): "아직 별점이 없어요", 0점/0.0은 없어요', emptyDetail.includes('아직 별점이 없어요') && !emptyDetail.includes('>0.0<') && !emptyDetail.includes('>0<'))
  const emptyCard = wrap({}, h(Probe, null, (info) => h(StageCard, { ...bakery, id: 111, rating: info.average, reviewCount: info.count, ratingStatus: info.status, districtLabel: '서면' })))
  check('리뷰 0개(목록 카드): "아직 별점이 없어요 · 첫 리뷰를 남겨주세요", 0.0은 없어요', emptyCard.includes('아직 별점이 없어요 · 첫 리뷰를 남겨주세요') && !emptyCard.includes('>0.0<'))
  const emptyPreview = wrap({}, h(PreviewCard, { bakery, isSelected: true, variant: 'overlay' }))
  check('리뷰 0개(지도 카드): "아직 별점이 없어요", 0.0은 없어요', emptyPreview.includes('아직 별점이 없어요') && !emptyPreview.includes('>0.0<'))

  // 불러오는 중
  const loadingCard = wrap(null, h(StageCard, { ...bakery, id: 111, rating: 0, reviewCount: 0, ratingStatus: 'loading', districtLabel: '서면' }), 'loading')
  check('집계를 불러오는 중에는 0점 대신 "별점을 불러오는 중이에요…"', loadingCard.includes('별점을 불러오는 중이에요') && !loadingCard.includes('>0.0<'))

  const errorDetail = wrap(null, h(Summary, { info: { status: 'error', average: 0, count: 0 } }), 'error')
  check('불러오기 실패(상세): "별점을 불러오지 못했어요" (아직 별점이 없어요가 아니에요)', errorDetail.includes('별점을 불러오지 못했어요') && !errorDetail.includes('아직 별점이 없어요'))
  const errorCard = wrap(null, h(StageCard, { ...bakery, id: 111, rating: 0, reviewCount: 0, ratingStatus: 'error', districtLabel: '서면' }), 'error')
  check('불러오기 실패(목록 카드): "별점을 불러오지 못했어요"', errorCard.includes('별점을 불러오지 못했어요') && !errorCard.includes('아직 별점이 없어요'))

  // 소수점 첫째 자리
  const five = wrap({ 111: { average: 5, count: 1 } }, h(Probe, null, (info) => h(Summary, { info })))
  check('평균 5점도 "5.0"처럼 소수점 첫째 자리까지', five.includes('>5.0<'))
}

// 로컬 모드: 예전 방식 그대로
{
  const localServer = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', define: { 'import.meta.env.VITE_DATA_BACKEND': JSON.stringify('local') } })
  const { default: theme } = await localServer.ssrLoadModule('/src/theme.js')
  const { ReviewsContext } = await localServer.ssrLoadModule('/src/context/contexts.js')
  const { RealBakeryPhotosProvider } = await localServer.ssrLoadModule('/src/context/RealBakeryPhotosContext.jsx')
  const StageCard = (await localServer.ssrLoadModule('/src/components/common/BakeryStageCard.jsx')).default
  const PreviewCard = (await localServer.ssrLoadModule('/src/components/home/BakeryMapPreviewCard.jsx')).default
  const wrap = (node) =>
    clean(renderToString(h(ThemeProvider, { theme }, h(MemoryRouter, null, h(ReviewsContext.Provider, { value: { reviews: [], loaded: true, ratingStats: null, ratingStatsStatus: 'off' } }, h(RealBakeryPhotosProvider, null, node))))))
  const bakery = { id: '111', name: '시험 빵집', districtId: 'seomyeon', address: '부산', rating: 4, heartCount: 2, tags: [], signatureMenu: '', lat: 35, lng: 129 }
  const withRating = wrap(h(StageCard, { ...bakery, id: 111, reviewCount: 5, districtLabel: '서면' }))
  check('로컬 모드 목록 카드: 빵집 정보의 rating(4.0)과 예시 리뷰 수 그대로', withRating.includes('>4.0<') && withRating.includes('>5<'))
  const none = wrap(h(StageCard, { ...bakery, rating: 0, id: 111, reviewCount: 0, districtLabel: '서면' }))
  check('로컬 모드 목록 카드: 평점 · 리뷰 없으면 예전 문구 그대로', none.includes('아직 리뷰가 없어요 · 첫 리뷰를 남겨주세요') && !none.includes('아직 별점이 없어요'))
  const preview = wrap(h(PreviewCard, { bakery, isSelected: true, variant: 'overlay' }))
  check('로컬 모드 지도 카드: rating(4.0) 그대로, 리뷰 개수 표시 없음', preview.includes('>4.0<') && !preview.includes('(0)'))
  const previewNone = wrap(h(PreviewCard, { bakery: { ...bakery, rating: 0 }, isSelected: true, variant: 'overlay' }))
  check('로컬 모드 지도 카드: rating 0이면 평점 줄을 숨겨요 (예전 그대로)', !previewNone.includes('아직 별점이 없어요') && !previewNone.includes('>0.0<'))
  await localServer.close()
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
