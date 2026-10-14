// Supabase 리뷰 저장소(작성 · 수정 · 삭제 · 목록 · 사진 · 오류 안내) 검증. 진짜 서버 대신 가짜 클라이언트를 써요.
// 실행 (프로젝트 폴더에서):  node supabase/tests/review-repository.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
// 개발용 오류 출력(콘솔)은 이 시험에서는 끄고, 안내 문구만 확인해요
const sharedModule = await server.ssrLoadModule('/src/storage/supabaseShared.js')
sharedModule.setDebugLogger(() => {})
const { createSupabaseReviewRepository, toReviewError } = await server.ssrLoadModule('/src/storage/supabaseReviewRepository.js')

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

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const row = (over = {}) => ({
  id: 'r1',
  user_id: 'me',
  bakery_id: '111',
  rating: '4.5',
  content: '맛있어요',
  photo_path: null,
  exp_review: true,
  exp_photo: false,
  created_at: '2026-10-14T01:00:00Z',
  updated_at: '2026-10-14T01:00:00Z',
  profiles: { nickname: '빵덕후' },
  bakeries: { name: '테스트빵집', district_id: 'seomyeon' },
  ...over,
})

// 가짜 Supabase 클라이언트
const makeFake = (state = {}) => {
  const log = { inserts: [], updates: [], deletes: 0, uploads: [], removes: [], invokes: [], queries: [] }
  const s = { session: { user: { id: 'me' } }, registered: true, rows: [row()], ...state }
  const result = async (q) => {
    log.queries.push(q.table + ':' + q.op)
    if (s.networkDown) throw new TypeError('Failed to fetch')
    if (q.table === 'bakeries') return { data: s.registered ? { id: q.filters.id } : null, error: null }
    if (q.table === 'game_settings') return { data: [{ key: 'daily_exp_cap', value: 100 }, { key: 'review_exp', value: 30 }, { key: 'photo_exp', value: 10 }], error: null }
    if (q.table === 'user_progress') return { data: [{ user_id: 'me', level_index: 2 }, { user_id: 'other', level_index: 0 }], error: null }
    if (q.op === 'insert') {
      log.inserts.push(q.payload)
      if (s.insertError) return { data: null, error: s.insertError }
      return { data: row({ ...q.payload, id: 'new', exp_review: s.flags?.exp_review ?? true, exp_photo: s.flags?.exp_photo ?? false }), error: null }
    }
    if (q.op === 'update') {
      log.updates.push({ patch: q.payload, filters: q.filters })
      if (s.updateError) return { data: null, error: s.updateError }
      return { data: row({ ...q.payload }), error: null }
    }
    if (q.op === 'delete') {
      log.deletes += 1
      return { data: s.deleteRows ?? [{ id: q.filters.id, photo_path: s.deletePhoto ?? null }], error: null }
    }
    // select
    let data = s.rows
    if (q.filters.user_id) data = data.filter((r) => r.user_id === q.filters.user_id)
    if (q.single) {
      const found = q.filters.id ? (s.currentRow === undefined ? data.find((r) => r.id === q.filters.id) ?? null : s.currentRow) : data[0] ?? null
      return { data: found, error: null }
    }
    return { data, error: null }
  }
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null, single: false }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      gt: () => builder,
      order: () => builder,
      limit: () => builder,
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      update: (payload) => ((q.op = 'update'), (q.payload = payload), builder),
      delete: () => ((q.op = 'delete'), builder),
      maybeSingle: () => ((q.single = 'maybe'), result(q)),
      single: () => ((q.single = 'one'), result(q)),
      then: (resolve, reject) => result(q).then(resolve, reject),
    }
    return builder
  }
  const client = {
    log,
    from,
    auth: { getSession: async () => ({ data: { session: s.session }, error: null }) },
    storage: {
      from: () => ({
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/photos/${path}` } }),
        upload: async (path, blob, options) => {
          log.uploads.push({ path, type: options.contentType, size: blob.size })
          return s.uploadError ? { data: null, error: s.uploadError } : { data: { path }, error: null }
        },
        remove: async (paths) => {
          log.removes.push(...paths)
          return { data: [], error: null }
        },
      }),
    },
    functions: {
      invoke: async (name, { body }) => {
        log.invokes.push({ name, body })
        if (s.invokeError) return { data: null, error: s.invokeError }
        s.registered = true
        return { data: { ok: true }, error: null }
      },
    },
  }
  return client
}
const repoFor = (state) => {
  const client = makeFake(state)
  return { client, repo: createSupabaseReviewRepository(async () => client) }
}
const invokeError = (status, body) => Object.assign(new Error('fn'), { context: { status, json: async () => body } })
const baseInput = { bakeryId: '111', bakerySource: 'kakao', bakeryName: '테스트빵집', districtId: 'seomyeon', bakeryLat: 35.15, bakeryLng: 129.06, bakeryAddress: '부산', rating: 4.5, content: ' 맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 ' }

// ── 목록 ──
{
  const { repo } = repoFor({ rows: [row({ id: 'a', user_id: 'other', created_at: '2026-10-14T03:00:00Z', photo_path: 'other/x.jpg' }), row({ id: 'b' })] })
  const list = await repo.list()
  const first = list[0]
  check('목록: 최신순 + 로컬 리뷰와 같은 모양으로 변환', list.length === 2 && first.id === 'a' && first.userId === 'other' && first.bakerySource === 'kakao' && first.rating === 4.5 && first.authorNickname === '빵덕후' && first.districtId === 'seomyeon')
  check('목록: 사진 경로는 공개 주소로, 서버가 정한 EXP 여부를 그대로 가져와요', first.photo === 'https://cdn.test/photos/other/x.jpg' && list[1].expReview === true && list[1].expPhoto === false)
  check('목록: 내 리뷰와 최신 리뷰가 겹쳐도 중복 없이', list.filter((r) => r.id === 'b').length === 1)
  check('레벨 · 설정 조회', (await repo.listLevels()).me === 2 && (await repo.getSettings()).dailyExpCap === 100)
}

// ── 작성 ──
{
  const { repo, client } = repoFor({})
  const error = await rejects(repo.create({ ...baseInput, bakerySource: 'sample', bakeryId: '1' }))
  check('예시 빵집은 서버에 저장하지 않아요', error?.code === 'SAMPLE_BAKERY' && client.log.inserts.length === 0 && client.log.queries.length === 0)
}
{
  const { repo } = repoFor({ session: null })
  check('로그인하지 않으면 거부', (await rejects(repo.create(baseInput)))?.code === 'NOT_SIGNED_IN')
}
{
  const { repo, client } = repoFor({ flags: { exp_review: false, exp_photo: false } })
  const created = await repo.create(baseInput)
  const payload = client.log.inserts[0]
  check('작성: 서버에는 빵집 · 별점 · 내용 · 사진 경로만 보내요(EXP · 작성자 · 날짜 없음)', JSON.stringify(Object.keys(payload).sort()) === '["bakery_id","content","photo_path","rating"]', JSON.stringify(payload))
  check('작성: 내용은 앞뒤 공백 제거', payload.content === '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다')
  check('작성: 이미 등록된 빵집이면 등록 함수를 부르지 않아요', client.log.invokes.length === 0)
  check('작성: 서버가 정한 EXP 여부(상한 초과 시 false)를 그대로 돌려줘요', created.expReview === false)
}
{
  const { repo, client } = repoFor({ registered: false })
  await repo.create(baseInput)
  const call = client.log.invokes[0]
  check('작성: 처음 쓰는 빵집은 서버 함수로 등록 요청', call.name === 'register-bakery' && call.body.id === '111' && call.body.lat === 35.15 && call.body.lng === 129.06 && client.log.inserts.length === 1)
}
{
  const { repo, client } = repoFor({ registered: false, invokeError: invokeError(404, null) })
  const error = await rejects(repo.create(baseInput))
  check('빵집 확인 함수가 배포되지 않았으면 안내하고 저장하지 않아요', error?.code === 'FUNCTION_MISSING' && client.log.inserts.length === 0)
}
{
  const { repo, client } = repoFor({ registered: false, invokeError: invokeError(400, { error: { code: 'BAKERY_NOT_FOUND', message: '실제 제과 · 베이커리로 확인되지 않았어요.' } }) })
  const error = await rejects(repo.create(baseInput))
  check('서버가 빵집을 거절하면 그 이유를 보여주고 저장하지 않아요', error?.code === 'BAKERY_REJECTED' && /확인되지/.test(error.message) && client.log.inserts.length === 0)
}
{
  const { repo, client } = repoFor({})
  const created = await repo.create({ ...baseInput, photo: PHOTO })
  const upload = client.log.uploads[0]
  check('사진: 내 폴더(사용자ID/…)에 JPEG로 업로드', /^me\/[^/]+\.jpg$/.test(upload.path) && upload.type === 'image/jpeg' && upload.size > 0)
  check('사진: 업로드한 경로가 리뷰에 연결돼요', client.log.inserts[0].photo_path === upload.path && created.photo.endsWith(upload.path))
}
{
  const { repo, client } = repoFor({ insertError: { code: '23505', message: 'duplicate' } })
  const error = await rejects(repo.create({ ...baseInput, photo: PHOTO }))
  check('중복 리뷰 안내', error?.code === 'DUPLICATE_REVIEW')
  check('저장에 실패하면 방금 올린 사진을 지워요', client.log.removes.length === 1 && client.log.removes[0] === client.log.uploads[0].path)
}
{
  const { repo, client } = repoFor({ uploadError: { message: 'Payload too large' } })
  const error = await rejects(repo.create({ ...baseInput, photo: PHOTO }))
  check('사진 업로드 실패 → 안내하고 일지도 저장하지 않아요', error?.code === 'PHOTO_FAILED' && client.log.inserts.length === 0)
}
for (const [label, insertError, expected] of [
  ['하루 작성 상한', { message: 'DAILY_REVIEW_LIMIT' }, 'DAILY_REVIEW_LIMIT'],
  ['이메일 미인증', { message: 'EMAIL_NOT_VERIFIED', code: '42501' }, 'EMAIL_NOT_CONFIRMED'],
  ['등록 안 된 빵집(FK)', { code: '23503', message: 'fk' }, 'INVALID_BAKERY'],
  ['입력값 제약(check)', { code: '23514', message: 'check' }, 'INVALID_INPUT'],
  ['로그인 만료', { message: 'JWT expired', code: 'PGRST301' }, 'SESSION_EXPIRED'],
  ['권한 없음(RLS)', { message: 'new row violates row-level security policy', code: '42501' }, 'FORBIDDEN'],
  ['알 수 없는 오류', { message: 'boom', code: 'XX000' }, 'UNKNOWN'],
]) {
  const { repo } = repoFor({ insertError })
  const error = await rejects(repo.create(baseInput))
  check(`저장 오류 안내: ${label}`, error?.code === expected && /[가-힣]/.test(error.message), String(error?.code))
}
{
  const { repo, client } = repoFor({ networkDown: true })
  const error = await rejects(repo.create(baseInput))
  check('서버 연결 실패 → "저장되지 않았어요" 안내, 로컬 저장 없음', error?.code === 'NETWORK' && /저장되지 않았어요/.test(error.message) && client.log.inserts.length === 0)
}

// ── 수정 ──
{
  const { repo, client } = repoFor({ rows: [row({ photo_path: 'me/old.jpg' })] })
  await repo.update('r1', 'me', { rating: 3, content: ' 맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 수정 ', photo: 'https://cdn.test/photos/me/old.jpg' })
  const patch = client.log.updates[0].patch
  check('수정: 이미 올라간 사진 주소를 그대로 보내면 사진은 안 건드려요', !('photo_path' in patch) && client.log.uploads.length === 0 && client.log.removes.length === 0)
  check('수정: 별점 · 내용만 보내고 EXP 칸은 없어요', JSON.stringify(Object.keys(patch).sort()) === '["content","rating"]' && patch.content === '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 수정')
  check('수정: 내 리뷰 조건(user_id)으로만 고쳐요', client.log.updates[0].filters.user_id === 'me' && client.log.updates[0].filters.id === 'r1')
}
{
  const { repo, client } = repoFor({ rows: [row({ photo_path: 'me/old.jpg' })] })
  await repo.update('r1', 'me', { photo: null })
  check('수정: 사진 빼기 → 경로를 비우고 이전 파일 삭제', client.log.updates[0].patch.photo_path === null && client.log.removes.includes('me/old.jpg'))
}
{
  const { repo, client } = repoFor({ rows: [row({ photo_path: 'me/old.jpg' })] })
  await repo.update('r1', 'me', { photo: PHOTO })
  const newPath = client.log.uploads[0].path
  check('수정: 새 사진 → 업로드 후 연결하고 이전 파일 삭제', client.log.updates[0].patch.photo_path === newPath && client.log.removes.includes('me/old.jpg') && !client.log.removes.includes(newPath))
}
{
  const { repo, client } = repoFor({ rows: [row()], updateError: { message: 'x', code: 'XX000' } })
  const error = await rejects(repo.update('r1', 'me', { photo: PHOTO }))
  check('수정 실패 시 새로 올린 사진을 지워요', error && client.log.removes.includes(client.log.uploads[0].path))
}
{
  const { repo, client } = repoFor({ currentRow: null })
  const error = await rejects(repo.update('r1', 'me', { content: '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다 해킹' }))
  check('내 일지가 아니면(조회 결과 없음) 수정 요청을 보내지 않아요', error?.code === 'NOT_FOUND' && client.log.updates.length === 0)
}

// ── 삭제 ──
{
  const { repo, client } = repoFor({ deletePhoto: 'me/x.jpg' })
  await repo.remove('r1')
  check('삭제: 내 리뷰만 지우고 사진 파일도 정리', client.log.deletes === 1 && client.log.removes.includes('me/x.jpg'))
}
check('삭제할 게 없으면(남의 것 · 이미 삭제) 안내', (await rejects(repoFor({ deleteRows: [] }).repo.remove('r1')))?.code === 'NOT_FOUND')

// ── 오류 변환 / 로컬 저장 ──
check('toReviewError: 네트워크', toReviewError(new TypeError('Failed to fetch')).code === 'NETWORK')
check('이 모든 시나리오에서 localStorage에 아무것도 쓰지 않았어요', localWrites.length === 0, JSON.stringify(localWrites))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
