// 랭킹 저장소(Supabase) 검증: 읽기 전용 · 상위 10개 + 내 순위 · 오류 안내 · 예시/로컬 대체 없음.
// 진짜 서버 대신 가짜 클라이언트를 써요.   실행: node supabase/tests/ranking-repository.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { createSupabaseRankingRepository, RANKING_LIMIT } = await server.ssrLoadModule('/src/storage/supabaseRankingRepository.js')

const localWrites = []
globalThis.localStorage = { getItem: () => null, setItem: (...args) => localWrites.push(args), removeItem: () => {} }

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const rejects = async (promise) => {
  try {
    await promise
    return null
  } catch (error) {
    return error
  }
}

const expRow = (rank, userId, nickname = `모험가${rank}`) => ({ rank, user_id: userId, nickname, exp: 500 - rank, level_index: 3, review_count: 5, discovered_count: 4 })

const makeFake = (state = {}) => {
  const log = { queries: [] }
  const s = { session: { user: { id: 'me' } }, views: {}, ...state }
  const run = async (q) => {
    log.queries.push(q)
    if (s.networkDown) throw new TypeError('Failed to fetch')
    if (s.errors?.[q.table]) return { data: null, error: s.errors[q.table] }
    let rows = [...(s.views[q.table] ?? [])]
    if (q.filters.user_id) rows = rows.filter((r) => r.user_id === q.filters.user_id)
    rows.sort((a, b) => a.rank - b.rank)
    if (q.limit != null) rows = rows.slice(0, q.limit)
    if (q.mode === 'maybeSingle') return { data: rows[0] ?? null, error: null }
    return { data: rows, error: null }
  }
  const from = (table) => {
    const q = { table, filters: {}, orders: [], limit: null, mode: 'list', writes: [] }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      order: (column, opts) => (q.orders.push([column, opts?.ascending === false ? 'desc' : 'asc']), builder),
      limit: (n) => ((q.limit = n), builder),
      insert: () => (q.writes.push('insert'), builder),
      update: () => (q.writes.push('update'), builder),
      delete: () => (q.writes.push('delete'), builder),
      maybeSingle: () => ((q.mode = 'maybeSingle'), run(q)),
      then: (resolve, reject) => run(q).then(resolve, reject),
    }
    return builder
  }
  return { log, from, auth: { getSession: async () => ({ data: { session: s.session }, error: null }) } }
}
const repoFor = (state) => {
  const client = makeFake(state)
  return { client, repo: createSupabaseRankingRepository(async () => client) }
}

// ── EXP 순위: 상위 10개 + 내 순위 ──
{
  const rows = Array.from({ length: 15 }, (_, i) => expRow(i + 1, i === 14 ? 'me' : `u${i + 1}`))
  const { client, repo } = repoFor({ views: { ranking_exp: rows } })
  const { items, me } = await repo.getBoard('exp')
  const q = client.log.queries[0]
  check('EXP 순위: 서버 뷰에서 순위 오름차순 상위 10개만 요청', q.table === 'ranking_exp' && JSON.stringify(q.orders) === '[["rank","asc"]]' && q.limit === RANKING_LIMIT && RANKING_LIMIT === 10)
  check('EXP 순위: 10개를 화면용 모양으로 돌려줘요', items.length === 10 && items[0].rank === 1 && items[0].nickname === '모험가1' && items[0].exp === 499 && items[0].levelIndex === 3 && items[0].reviewCount === 5 && items[0].discoveredCount === 4)
  check('상위 10위 밖이어도 내 순위(15위)를 따로 가져와요', me?.rank === 15 && me.userId === 'me' && client.log.queries[1].filters.user_id === 'me')
}
{
  const rows = Array.from({ length: 15 }, (_, i) => expRow(i + 1, i === 2 ? 'me' : `u${i + 1}`))
  const { client, repo } = repoFor({ views: { ranking_exp: rows } })
  const { me } = await repo.getBoard('exp')
  check('내가 10위 안이면 추가 요청 없이 그 줄을 써요', me?.rank === 3 && client.log.queries.length === 1)
}
{
  const { repo } = repoFor({ views: { ranking_exp: [expRow(1, 'u1')] } })
  const { me } = await repo.getBoard('exp')
  check('순위에 없는 로그인 사용자는 me가 null이에요', me === null)
}
{
  const { client, repo } = repoFor({ session: null, views: { ranking_exp: [expRow(1, 'u1')] } })
  const { items, me } = await repo.getBoard('exp')
  check('비로그인도 순위를 읽고 내 순위는 없어요(내 순위 요청도 안 보내요)', items.length === 1 && me === null && client.log.queries.length === 1)
}

// ── 다른 랭킹 ──
{
  const { client, repo } = repoFor({
    views: {
      ranking_monthly_reviews: [{ rank: 1, user_id: 'u1', nickname: '리뷰왕', level_index: 2, month_review_count: 7, exp: 190, month_label: '2026-10' }],
      ranking_bakeries: [{ rank: 1, bakery_id: 'k1', bakery_name: '테스트빵집', district_id: 'seomyeon', review_count: 9, avg_rating: '4.5' }],
      ranking_posts: [{ rank: 1, post_id: 'p1', category_id: 'recommend', title: '인기글', user_id: 'u1', author_nickname: '글쓴이', author_level_index: 1, like_count: 12, comment_count: 3 }],
    },
  })
  const monthly = await repo.getBoard('monthly')
  check('이번 달 리뷰왕: 값과 월 표시', monthly.items[0].monthReviewCount === 7 && monthly.items[0].monthLabel === '2026-10' && monthly.items[0].levelIndex === 2)
  const bakeries = await repo.getBoard('bakeries')
  check('리뷰 많은 빵집: 평균 별점은 숫자로, 내 순위는 없어요(사용자 순위가 아님)', bakeries.items[0].avgRating === 4.5 && bakeries.items[0].reviewCount === 9 && bakeries.me === null)
  const posts = await repo.getBoard('posts')
  check('좋아요 많은 글: 제목 · 작성자 · 좋아요/댓글 수', posts.items[0].title === '인기글' && posts.items[0].author === '글쓴이' && posts.items[0].likeCount === 12 && posts.items[0].commentCount === 3)
  check('빵집 · 글 랭킹은 로그인 확인이나 내 순위 요청을 하지 않아요', client.log.queries.filter((q) => q.table === 'ranking_bakeries' || q.table === 'ranking_posts').every((q) => !q.filters.user_id))
}
{
  const { items, me } = await repoFor({ views: { ranking_posts: [] } }).repo.getBoard('posts')
  check('데이터가 없으면 빈 목록이에요 (예시 데이터를 섞지 않아요)', items.length === 0 && me === null)
}

// ── 읽기 전용 ──
{
  const { client, repo } = repoFor({
    views: { ranking_exp: [expRow(1, 'me')], ranking_monthly_reviews: [], ranking_bakeries: [], ranking_posts: [] },
  })
  for (const id of ['exp', 'monthly', 'bakeries', 'posts']) await repo.getBoard(id)
  check('저장소는 4가지 랭킹 모두 읽기만 해요(쓰기 호출 없음)', client.log.queries.every((q) => q.writes.length === 0))
  check('로컬 저장소에도 아무것도 쓰지 않아요', localWrites.length === 0)
  check('없는 랭킹 이름은 오류', (await rejects(repo.getBoard('visits')))?.code === 'LOAD_FAILED')
}

// ── 오류 안내 ──
{
  const { repo } = repoFor({ errors: { ranking_exp: { code: 'PGRST205', message: "Could not find the table 'public.ranking_exp' in the schema cache" } } })
  const error = await rejects(repo.getBoard('exp'))
  // 478df91에서 이용자 화면의 오류 문구는 "기술 용어 없는 쉬운 안내"로 바꾸기로 했어요 (예전 기대값은 문구에 0005가 있어야 했어요).
  // 그래서 지금 기준: 코드는 NOT_SET_UP, 문구는 "준비하는 중 · 다시 시도 · 문의처"를 알려주고, 마이그레이션 번호 · 뷰 이름 · 서버 오류 코드 같은 기술 용어는 하나도 없어야 해요.
  check(
    '뷰가 아직 없으면(0005 미적용) 쉬운 "준비 중" 안내가 나와요 (기술 용어 없음)',
    error?.code === 'NOT_SET_UP' &&
      /준비하는 중/.test(error.message) &&
      /다시 시도/.test(error.message) &&
      /문의처/.test(error.message) &&
      !/0005|마이그레이션|SQL|ranking_|PGRST|42P01|schema/i.test(error.message),
    error?.message,
  )
}
{
  const { repo } = repoFor({ errors: { ranking_exp: { code: '42P01', message: 'relation "public.ranking_exp" does not exist' } } })
  check('없는 뷰(42P01)도 같은 안내', (await rejects(repo.getBoard('exp')))?.code === 'NOT_SET_UP')
}
{
  const { repo } = repoFor({ errors: { ranking_exp: { code: 'XX000', message: 'internal secret detail' } } })
  const error = await rejects(repo.getBoard('exp'))
  check('서버 오류는 내부 내용을 숨기고 한국어로 안내', error?.code === 'LOAD_FAILED' && !/secret|XX000/.test(error.message), error?.message)
}
{
  const { repo } = repoFor({ networkDown: true })
  const error = await rejects(repo.getBoard('exp'))
  check('네트워크가 끊기면 연결 안내(예시 순위로 대체하지 않아요)', error?.code === 'NETWORK' && !/저장/.test(error.message), error?.message)
}
{
  const client = makeFake({ views: { ranking_exp: [expRow(1, 'u1')] } })
  const failing = { ...client, auth: { getSession: async () => ({ data: { session: null }, error: new Error('session broken') }) } }
  const error = await rejects(createSupabaseRankingRepository(async () => failing).getBoard('exp'))
  check('로그인 상태를 확인하지 못하면 오류로 알려요(조용히 넘기지 않아요)', error?.code === 'LOAD_FAILED')
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
