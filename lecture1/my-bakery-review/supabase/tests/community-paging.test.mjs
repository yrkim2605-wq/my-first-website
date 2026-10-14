// 커뮤니티 "더 보기"(20개씩) 쪽 나누기 검증: 쪽을 넘겨도 글이 겹치거나 빠지지 않는지, 정렬이 일정한지.
//  - 저장소(listPosts)가 실제로 만드는 정렬 · 범위 요청을 진짜 Postgres(PGlite)에서 그대로 실행해요 (가짜 결과가 아니에요).
//  - 일부러 동점을 많이 넣어요: 좋아요 수 · 댓글 수 · 작성 시각이 같은 글이 많아서, "글 ID까지 정한 정렬"이 없으면 쪽 경계에서 어긋나요.
// 실행: PGLITE_DIR=<pglite가 설치된 폴더> node supabase/tests/community-paging.test.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const pgliteDir = process.env.PGLITE_DIR
if (!pgliteDir) throw new Error('PGLITE_DIR 환경변수에 pglite가 설치된 폴더를 알려주세요.')
const { PGlite } = await import(pathToFileURL(path.join(pgliteDir, 'node_modules/@electric-sql/pglite/dist/index.js')).href)

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const sql = (file) => fs.readFileSync(path.join(here, file), 'utf8')
const db = new PGlite()
await db.exec(sql('supabase_stub.sql'))
for (const file of ['0001_schema', '0002_rls', '0004_community']) await db.exec(sql(`../migrations/${file}.sql`))
const admin = async (text, params = []) => (await db.query(text, params)).rows
const asAnon = async (text, params = []) => {
  await db.exec("reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);")
  try {
    return (await db.query(text, params)).rows
  } finally {
    await db.exec('reset role')
  }
}

// ── 시험 데이터: 글 55개, 동점이 아주 많아요 ──
const users = ['a', 'b', 'c', 'd'].map((x) => `00000000-0000-0000-0000-00000000030${x === 'a' ? 1 : x === 'b' ? 2 : x === 'c' ? 3 : 4}`)
for (const [i, id] of users.entries()) await admin(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3)`, [id, `p${i}@test.dev`, JSON.stringify({ nickname: `쪽${i + 1}` })])
const CATEGORIES = ['today-visit', 'new-menu', 'open-run', 'recommend', 'photo']
await admin('alter table public.posts disable trigger posts_before_insert')
await admin('alter table public.comments disable trigger comments_before_insert')
await admin('alter table public.comments disable trigger comments_check_parent')
await admin('alter table public.post_likes disable trigger post_likes_before_insert')
const base = Date.parse('2026-10-01T00:00:00Z')
const TOTAL = 55
for (let i = 0; i < TOTAL; i += 1) {
  // 작성 시각은 7가지뿐(대부분 같은 시각), 카테고리는 5가지
  const createdAt = new Date(base + (i % 7) * 3600 * 1000).toISOString()
  const id = `00000000-0000-4000-8000-${String(100000000000 + i)}`
  await admin(`insert into public.posts (id, user_id, category_id, title, content, created_at, updated_at) values ($1, $2, $3, $4, '내용', $5, $5)`, [id, users[i % 4], CATEGORIES[i % 5], `글 ${i}`, createdAt])
  // 좋아요 0~3개(대부분 동점), 댓글 0~2개
  for (const [k, userId] of users.entries()) if (k < (i * 7) % 4) await admin(`insert into public.post_likes (post_id, user_id) values ($1, $2)`, [id, userId])
  for (let c = 0; c < (i * 5) % 3; c += 1) await admin(`insert into public.comments (post_id, user_id, content) values ($1, $2, '댓글')`, [id, users[c]])
}

// ── 저장소를 진짜 DB에 연결: 저장소가 만든 정렬 · 범위 요청을 그대로 SQL로 실행 ──
const COLUMNS = new Set(['like_count', 'comment_count', 'created_at', 'id'])
const requests = []
const makeClient = () => ({
  auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  from: (table) => {
    if (table !== 'post_feed') throw new Error(`예상하지 못한 표: ${table}`)
    const q = { filters: {}, orders: [], range: null, count: null }
    const builder = {
      select: (columns, opts) => ((q.count = opts?.count ?? null), builder),
      eq: (key, value) => ((q.filters[key] = value), builder),
      order: (column, opts) => {
        if (!COLUMNS.has(column)) throw new Error(`허용하지 않은 정렬 칸: ${column}`)
        q.orders.push([column, opts?.ascending === false ? 'desc' : 'asc'])
        return builder
      },
      range: async (from, to) => {
        requests.push({ filters: { ...q.filters }, orders: q.orders.map((o) => [...o]), range: [from, to] })
        const where = q.filters.category_id ? 'where category_id = $1' : ''
        const params = q.filters.category_id ? [q.filters.category_id] : []
        const orderBy = q.orders.map(([c, d]) => `${c} ${d}`).join(', ')
        const rows = await asAnon(`select * from public.post_feed ${where} order by ${orderBy} offset ${from} limit ${to - from + 1}`, params)
        const count = q.count === 'exact' ? Number((await asAnon(`select count(*)::int n from public.post_feed ${where}`, params))[0].n) : undefined
        return { data: rows, error: null, count }
      },
    }
    return builder
  },
})

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
;(await server.ssrLoadModule('/src/storage/supabaseShared.js')).setDebugLogger(() => {})
const { createSupabaseCommunityRepository, POST_PAGE_SIZE } = await server.ssrLoadModule('/src/storage/supabaseCommunityRepository.js')
const { mergePostPages } = await server.ssrLoadModule('/src/utils/communityPaging.js')
const repo = createSupabaseCommunityRepository(async () => makeClient())

check('쪽 크기는 20개', POST_PAGE_SIZE === 20)

// 쪽을 끝까지 넘기며 모아요 (화면이 "더 보기"를 누를 때와 같은 방식: 지금까지 받은 글 수를 offset으로)
const pageThrough = async (options) => {
  const collected = []
  let pages = 0
  let total = null
  for (;;) {
    const page = await repo.listPosts({ ...options, offset: collected.length, limit: POST_PAGE_SIZE })
    pages += 1
    total = page.total
    collected.push(...page.posts)
    if (!page.hasMore) break
    if (pages > 20) throw new Error('쪽 넘기기가 끝나지 않아요')
  }
  return { collected, pages, total }
}

const METRIC = { latest: null, heart: 'like_count', comment: 'comment_count' }
for (const sortBy of ['latest', 'heart', 'comment']) {
  for (const categoryId of ['all', 'recommend', 'photo']) {
    const label = `${sortBy === 'latest' ? '최신순' : sortBy === 'heart' ? '좋아요순' : '댓글순'} · ${categoryId === 'all' ? '전체' : categoryId}`
    const { collected, pages, total } = await pageThrough({ sortBy, categoryId })
    const ids = collected.map((p) => p.id)
    const truth = await asAnon(`select id, like_count::int likes, comment_count::int comments, created_at from public.post_feed ${categoryId === 'all' ? '' : "where category_id = '" + categoryId + "'"}`)
    const expectedCount = truth.length
    check(`${label}: 쪽 ${pages}번으로 ${expectedCount}개 모두, 전체 글 수(total)도 맞아요`, ids.length === expectedCount && total === expectedCount, `받은 ${ids.length} / 실제 ${expectedCount} / total ${total}`)
    check(`${label}: 같은 글이 두 번 나오지 않아요`, new Set(ids).size === ids.length)
    check(`${label}: 빠진 글이 없어요 (DB의 글과 정확히 같은 집합)`, JSON.stringify([...ids].sort()) === JSON.stringify(truth.map((r) => r.id).sort()))
    // 순서: 기준 값 내림차순 → 작성 시각 내림차순 → 글 ID 내림차순 (독립적으로 JS에서 계산해서 비교)
    const key = (row) => [METRIC[sortBy] ? Number(sortBy === 'heart' ? row.likes : row.comments) : 0, new Date(row.created_at).getTime(), row.id]
    const sorted = [...truth].sort((a, b) => {
      const x = key(a)
      const y = key(b)
      return y[0] - x[0] || y[1] - x[1] || (x[2] < y[2] ? 1 : x[2] > y[2] ? -1 : 0)
    })
    check(`${label}: 쪽을 이어 붙인 순서가 "기준 → 최신 → 글 ID" 정렬과 정확히 같아요`, JSON.stringify(ids) === JSON.stringify(sorted.map((r) => r.id)))
    const again = await pageThrough({ sortBy, categoryId })
    check(`${label}: 다시 처음부터 넘겨도 순서가 똑같아요 (정렬이 일정해요)`, JSON.stringify(again.collected.map((p) => p.id)) === JSON.stringify(ids))
  }
}

// 동점이 실제로 많았는지 (시험이 의미 있는지)
{
  const likes = await asAnon('select like_count::int n, count(*)::int c from public.post_feed group by 1 order by 1')
  const times = await asAnon('select count(distinct created_at)::int c from public.post_feed')
  check('시험 데이터에 동점이 많아요 (좋아요 수 종류 4가지에 글 55개, 작성 시각 7가지뿐)', likes.length <= 4 && Number(times[0].c) === 7)
}

// 요청 모양: 항상 20+1개 범위, 정렬 끝에 글 ID, 카테고리 조건
{
  check('모든 요청이 한 건 더 받는 범위(20개 + 1)예요', requests.every((r) => r.range[1] - r.range[0] === POST_PAGE_SIZE))
  check('모든 요청의 정렬 맨 끝은 글 ID예요 (동점을 끝까지 가려요)', requests.every((r) => r.orders.at(-1)[0] === 'id'))
  check('둘째 쪽은 첫 쪽에서 받은 20개를 건너뛰어요 (범위 20~40)', requests.some((r) => r.range[0] === 20 && r.range[1] === 40) && requests.some((r) => r.range[0] === 40))
}

// 정렬/카테고리를 바꾸면 처음부터: 새 조건의 첫 쪽은 offset 0, 이전 목록과 섞이지 않아요
{
  const heartFirst = await repo.listPosts({ sortBy: 'heart', categoryId: 'all', offset: 0 })
  const latestFirst = await repo.listPosts({ sortBy: 'latest', categoryId: 'all', offset: 0 })
  const lastTwo = requests.slice(-2)
  check('정렬을 바꿔 다시 불러오면 둘 다 offset 0에서 시작해요', lastTwo.every((r) => r.range[0] === 0))
  check('두 정렬의 첫 쪽은 서로 다른 순서의 20개예요', heartFirst.posts.length === 20 && latestFirst.posts.length === 20 && heartFirst.posts[0].id !== latestFirst.posts[0].id)
}

// 쪽을 넘기는 중에 다른 사람이 새 글을 쓴 경우: 겹치는 글은 한 번만 보여요
{
  const first = await repo.listPosts({ sortBy: 'latest', offset: 0 })
  await admin(`insert into public.posts (id, user_id, category_id, title, content, created_at, updated_at) values ('00000000-0000-4000-8000-999999999999', $1, 'recommend', '새 글', '내용', now(), now())`, [users[0]])
  const second = await repo.listPosts({ sortBy: 'latest', offset: first.posts.length })
  const merged = mergePostPages(first.posts, second.posts)
  check('새 글이 생겨 쪽 경계가 밀려도 같은 글이 두 번 나오지 않아요 (글 ID로 걸러요)', merged.length === new Set(merged.map((p) => p.id)).size)
  check('이어 붙이기 도우미: 이미 있는 글은 건너뛰고 순서는 그대로', JSON.stringify(mergePostPages([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]).map((p) => p.id)) === '["a","b","c"]')
  check('새 글이 생긴 뒤 다시 불러오면 전체 글 수(total)가 늘어요', second.total === TOTAL + 1)
}

// ── 더 보기 영역 문구 (서버 렌더링) ──
{
  const { createElement: h } = await import('react')
  const { renderToString } = await import('react-dom/server')
  const { ThemeProvider } = await import('@mui/material/styles')
  const { default: theme } = await server.ssrLoadModule('/src/theme.js')
  const { default: Footer } = await server.ssrLoadModule('/src/components/common/LoadMoreFooter.jsx')
  const render = (props) => renderToString(h(ThemeProvider, { theme }, h(Footer, { pageSize: 20, onLoadMore: () => {}, ...props }))).replace(/<!-- -->/g, '')
  const more = render({ hasMore: true })
  check('다음 쪽이 있으면 "더 보기 (20개씩)" 버튼', more.includes('더 보기 (20개씩)') && !more.includes('마지막 글이에요') && !more.includes('disabled=""'))
  const loading = render({ hasMore: true, loading: true })
  check('불러오는 중에는 버튼이 잠기고 "불러오는 중…"', loading.includes('불러오는 중…') && loading.includes('disabled=""'))
  const failed = render({ hasMore: true, errorMessage: '서버에 연결하지 못했어요.' })
  check('실패하면 이유 + "지금까지 보던 글은 그대로예요" + "다시 시도" 버튼', failed.includes('서버에 연결하지 못했어요.') && failed.includes('지금까지 보던 글은 그대로예요') && failed.includes('다시 시도'))
  const end = render({ hasMore: false })
  check('다음 쪽이 없으면 버튼 없이 "마지막 글이에요"', end.includes('마지막 글이에요') && !end.includes('더 보기'))
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
