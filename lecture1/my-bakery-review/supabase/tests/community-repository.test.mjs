// 커뮤니티 저장소(Supabase) 검증: 서버로 보내는 값 · 입력 검사 · 오류 안내 · 로컬 저장 없음.
// 진짜 서버 대신 가짜 클라이언트를 써요.   실행: node supabase/tests/community-repository.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { createSupabaseCommunityRepository } = await server.ssrLoadModule('/src/storage/supabaseCommunityRepository.js')

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

const POST_ROW = {
  id: 'p1', category_id: 'recommend', title: '제목', content: '본문', user_id: 'me', author_nickname: '나', author_level_index: 2,
  like_count: 3, comment_count: 4, liked_by_me: true, created_at: '2026-10-14T01:00:00Z', updated_at: '2026-10-14T01:00:00Z',
}

const makeFake = (state = {}) => {
  const log = { queries: [] }
  const s = { session: { user: { id: 'me' } }, rows: {}, ...state }
  const run = async (q) => {
    log.queries.push(q)
    if (s.networkDown) throw new TypeError('Failed to fetch')
    const forced = s.errors?.[`${q.table}:${q.op}`]
    if (forced) return { data: null, error: forced }
    if (q.op === 'select') {
      const rows = s.rows[q.table] ?? []
      if (q.mode === 'maybeSingle') return { data: rows.find((r) => r.id === q.filters.id) ?? null, error: null }
      return { data: rows, error: null }
    }
    if (q.op === 'insert') {
      if (q.mode === 'single') return { data: { id: 'new-post' }, error: null }
      return { data: null, error: null }
    }
    if (q.op === 'update') return { data: s.updateRows ?? [{ id: q.filters.id }], error: null }
    return { data: null, error: null } // delete
  }
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, orders: [], payload: null, limit: null, mode: 'list' }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      order: (column, opts) => (q.orders.push([column, opts?.ascending === false ? 'desc' : 'asc']), builder),
      limit: (n) => ((q.limit = n), builder),
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      update: (payload) => ((q.op = 'update'), (q.payload = payload), builder),
      delete: () => ((q.op = 'delete'), builder),
      single: () => ((q.mode = 'single'), run(q)),
      maybeSingle: () => ((q.mode = 'maybeSingle'), run(q)),
      then: (resolve, reject) => run(q).then(resolve, reject),
    }
    return builder
  }
  return { log, from, auth: { getSession: async () => ({ data: { session: s.session }, error: null }) } }
}
const repoFor = (state) => {
  const client = makeFake(state)
  return { client, repo: createSupabaseCommunityRepository(async () => client) }
}
const lastQuery = (client, table, op) => [...client.log.queries].reverse().find((q) => q.table === table && q.op === op)

// ── 글 목록 · 상세 ──
{
  const { client, repo } = repoFor({ rows: { post_feed: [POST_ROW, { ...POST_ROW, id: 'p2', user_id: 'other', liked_by_me: false }] } })
  const posts = await repo.listPosts({ categoryId: 'all', sortBy: 'heart' })
  const q = lastQuery(client, 'post_feed', 'select')
  check('글 목록: 서버 뷰에서 좋아요순 → 최신순으로 정렬해 요청', JSON.stringify(q.orders) === '[["like_count","desc"],["created_at","desc"]]' && q.limit === 100, JSON.stringify(q.orders))
  check('글 목록: 전체 보기는 카테고리 조건이 없어요', !('category_id' in q.filters))
  check('글 목록: 화면용 모양으로 바뀌고 내 글 표시가 맞아요', posts[0].heartCount === 3 && posts[0].commentCount === 4 && posts[0].author === '나' && posts[0].isMine === true && posts[1].isMine === false && posts[0].likedByMe === true)
  await repo.listPosts({ categoryId: 'new-menu', sortBy: 'latest' })
  const q2 = lastQuery(client, 'post_feed', 'select')
  check('글 목록: 카테고리 조건 · 최신순은 날짜만 정렬', q2.filters.category_id === 'new-menu' && JSON.stringify(q2.orders) === '[["created_at","desc"]]', JSON.stringify(q2))
  check('글 상세: 글 하나를 돌려줘요', (await repo.getPost('p1')).title === '제목')
  check('글 상세: 없는 글은 null (오류 아님)', (await repo.getPost('nope')) === null)
}
{
  const { repo } = repoFor({ session: null, rows: { post_feed: [POST_ROW] } })
  const posts = await repo.listPosts()
  check('비로그인도 글을 읽을 수 있고 내 글 표시는 없어요', posts.length === 1 && posts[0].isMine === false)
}
{
  const { repo } = repoFor({ errors: { 'post_feed:select': { code: '22P02', message: 'invalid input syntax for type uuid' } } })
  check('주소가 UUID 모양이 아니면 없는 글로 취급', (await repo.getPost('abc')) === null)
}

// ── 글쓰기 · 수정 · 삭제 ──
{
  const { client, repo } = repoFor()
  const id = await repo.createPost({ categoryId: 'recommend', title: '  새 글  ', content: ' 내용 ' })
  const q = lastQuery(client, 'posts', 'insert')
  check('글쓰기: 새 글 ID를 돌려줘요', id === 'new-post')
  check('글쓰기: 카테고리 · 제목 · 내용만 보내요(작성자 · 날짜는 서버가 정해요)', JSON.stringify(q.payload) === JSON.stringify({ category_id: 'recommend', title: '새 글', content: '내용' }), JSON.stringify(q.payload))
}
{
  const { client, repo } = repoFor()
  const bad = [
    ['빈 제목', { categoryId: 'recommend', title: '  ', content: 'x' }],
    ['81자 제목', { categoryId: 'recommend', title: 'ㅁ'.repeat(81), content: 'x' }],
    ['빈 내용', { categoryId: 'recommend', title: 't', content: '' }],
    ['2001자 내용', { categoryId: 'recommend', title: 't', content: 'ㅁ'.repeat(2001) }],
    ['없는 카테고리', { categoryId: 'hack', title: 't', content: 'x' }],
  ]
  for (const [label, input] of bad) {
    const error = await rejects(repo.createPost(input))
    check(`글쓰기 입력 검사: ${label}`, error?.code === 'INVALID_INPUT')
  }
  check('잘못된 입력은 서버로 보내지도 않아요', !client.log.queries.some((q) => q.op === 'insert'))
}
{
  const { client, repo } = repoFor()
  await repo.updatePost('p1', { categoryId: 'photo', title: '고친 제목', content: '고친 내용' })
  const q = lastQuery(client, 'posts', 'update')
  check('글 수정: 내 글 조건(id + user_id)으로 요청', q.filters.id === 'p1' && q.filters.user_id === 'me')
  check('글 수정: 바꿀 내용만 보내요', JSON.stringify(q.payload) === JSON.stringify({ category_id: 'photo', title: '고친 제목', content: '고친 내용' }))
}
{
  const { repo } = repoFor({ updateRows: [] })
  const error = await rejects(repo.updatePost('p1', { categoryId: 'recommend', title: 't', content: 'c' }))
  check('글 수정: 한 줄도 안 바뀌면(남의 글 · 없는 글) 성공 처리하지 않아요', error?.code === 'POST_NOT_FOUND')
}
{
  const { client, repo } = repoFor()
  await repo.deletePost('p1')
  const q = lastQuery(client, 'posts', 'delete')
  check('글 삭제: 내 글 조건(id + user_id)으로 요청', q.filters.id === 'p1' && q.filters.user_id === 'me')
}

// ── 댓글 ──
{
  const rows = [
    { id: 'c1', post_id: 'p1', parent_id: null, user_id: 'a', author_nickname: 'A', author_level_index: 0, content: '댓글1', is_mine: false, created_at: '2026-10-14T01:00:00Z' },
    { id: 'c2', post_id: 'p1', parent_id: 'c1', user_id: 'me', author_nickname: '나', author_level_index: 1, content: '답글', is_mine: true, created_at: '2026-10-14T02:00:00Z' },
    { id: 'c3', post_id: 'p1', parent_id: null, user_id: 'me', author_nickname: '나', author_level_index: 1, content: '댓글2', is_mine: true, created_at: '2026-10-14T03:00:00Z' },
  ]
  const { client, repo } = repoFor({ rows: { comment_feed: rows } })
  const comments = await repo.listComments('p1')
  const q = lastQuery(client, 'comment_feed', 'select')
  check('댓글 목록: 글 조건 + 오래된 순', q.filters.post_id === 'p1' && JSON.stringify(q.orders) === '[["created_at","asc"]]')
  check('댓글 목록: 최상위 댓글에 답글이 붙어요', comments.length === 2 && comments[0].replies.length === 1 && comments[0].replies[0].content === '답글' && comments[1].replies.length === 0)
  check('댓글 목록: 내 댓글 표시와 작성자 레벨', comments[0].isMine === false && comments[1].isMine === true && comments[1].authorLevelIndex === 1)
}
{
  const { client, repo } = repoFor()
  await repo.addComment({ postId: 'p1', content: '  좋은 글이네요  ' })
  await repo.addComment({ postId: 'p1', content: '답글', parentId: 'c1' })
  const inserts = client.log.queries.filter((q) => q.table === 'comments' && q.op === 'insert')
  check('댓글 쓰기: 글 ID와 내용만 보내요', JSON.stringify(inserts[0].payload) === JSON.stringify({ post_id: 'p1', content: '좋은 글이네요' }), JSON.stringify(inserts[0].payload))
  check('답글 쓰기: parent_id가 붙어요', inserts[1].payload.parent_id === 'c1')
  check('빈 댓글 · 501자 댓글은 거부', (await rejects(repo.addComment({ postId: 'p1', content: '   ' })))?.code === 'INVALID_INPUT'
    && (await rejects(repo.addComment({ postId: 'p1', content: 'ㅁ'.repeat(501) })))?.code === 'INVALID_INPUT')
  await repo.deleteComment('c1')
  const q = lastQuery(client, 'comments', 'delete')
  check('댓글 삭제: 내 댓글 조건(id + user_id)으로 요청', q.filters.id === 'c1' && q.filters.user_id === 'me')
  check('댓글 수정 기능은 없어요', repo.updateComment === undefined && repo.editComment === undefined)
}

// ── 좋아요 ──
{
  const { client, repo } = repoFor()
  await repo.setLike('p1', true)
  check('좋아요: 글 ID만 보내요', JSON.stringify(lastQuery(client, 'post_likes', 'insert').payload) === JSON.stringify({ post_id: 'p1' }))
  await repo.setLike('p1', false)
  const q = lastQuery(client, 'post_likes', 'delete')
  check('좋아요 취소: 내 좋아요 조건(post_id + user_id)', q.filters.post_id === 'p1' && q.filters.user_id === 'me')
}
{
  const { repo } = repoFor({ errors: { 'post_likes:insert': { code: '23505', message: 'duplicate key' } } })
  check('이미 누른 좋아요를 또 눌러도 성공', (await rejects(repo.setLike('p1', true))) === null)
}

// ── 로그인 · 오류 안내 ──
{
  const { client, repo } = repoFor({ session: null })
  const errors = await Promise.all([
    rejects(repo.createPost({ categoryId: 'recommend', title: 't', content: 'c' })),
    rejects(repo.updatePost('p1', { categoryId: 'recommend', title: 't', content: 'c' })),
    rejects(repo.deletePost('p1')),
    rejects(repo.addComment({ postId: 'p1', content: 'x' })),
    rejects(repo.deleteComment('c1')),
    rejects(repo.setLike('p1', true)),
  ])
  check('로그인하지 않으면 쓰기 6가지 모두 NOT_SIGNED_IN', errors.every((e) => e?.code === 'NOT_SIGNED_IN'), JSON.stringify(errors.map((e) => e?.code)))
  check('로그인하지 않으면 서버에 쓰기 요청을 보내지 않아요', !client.log.queries.some((q) => q.op !== 'select'))
}
const errorCase = async (label, table, op, dbError, expectedCode, call) => {
  const { repo } = repoFor({ errors: { [`${table}:${op}`]: dbError } })
  const error = await rejects(call(repo))
  check(label, error?.code === expectedCode && !!error.message && !/DAILY_LIMIT|violates|row-level/.test(error.message), `${error?.code} ${error?.message}`)
}
await errorCase('하루 작성 상한 → 안내', 'posts', 'insert', { message: 'DAILY_LIMIT', code: 'P0001' }, 'DAILY_LIMIT', (r) => r.createPost({ categoryId: 'recommend', title: 't', content: 'c' }))
await errorCase('댓글 상한 → 안내', 'comments', 'insert', { message: 'DAILY_LIMIT', code: 'P0001' }, 'DAILY_LIMIT', (r) => r.addComment({ postId: 'p1', content: 'x' }))
await errorCase('이메일 미인증 → 안내', 'posts', 'insert', { message: 'EMAIL_NOT_VERIFIED', code: '42501' }, 'EMAIL_NOT_CONFIRMED', (r) => r.createPost({ categoryId: 'recommend', title: 't', content: 'c' }))
await errorCase('지워진 글에 댓글(FK) → 안내', 'comments', 'insert', { message: 'fk', code: '23503' }, 'POST_NOT_FOUND', (r) => r.addComment({ postId: 'gone', content: 'x' }))
await errorCase('잘못된 답글 대상 → 입력 안내', 'comments', 'insert', { message: 'INVALID_PARENT', code: '23514' }, 'INVALID_INPUT', (r) => r.addComment({ postId: 'p1', content: 'x', parentId: 'c9' }))
await errorCase('권한 없음 → 커뮤니티 문구', 'posts', 'delete', { message: 'permission denied', code: '42501' }, 'FORBIDDEN', (r) => r.deletePost('p1'))
await errorCase('로그인 만료 → 안내', 'posts', 'insert', { message: 'JWT expired', code: 'PGRST301' }, 'SESSION_EXPIRED', (r) => r.createPost({ categoryId: 'recommend', title: 't', content: 'c' }))
{
  const { repo } = repoFor({ networkDown: true })
  const error = await rejects(repo.listPosts())
  check('네트워크 끊김 → 연결 안내', error?.code === 'NETWORK')
  const noPhrase = !/일지/.test(error?.message ?? '')
  check('커뮤니티 오류 문구에 "일지" 표현이 섞이지 않아요', noPhrase)
}
{
  const { repo } = repoFor({ networkDown: true })
  await rejects(repo.createPost({ categoryId: 'recommend', title: 't', content: 'c' }))
  await rejects(repo.addComment({ postId: 'p1', content: 'x' }))
  await rejects(repo.setLike('p1', true))
  check('연결 실패해도 localStorage에 몰래 저장하지 않아요', localWrites.length === 0)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
