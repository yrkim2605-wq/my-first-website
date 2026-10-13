// "다녀왔어요" 체크 저장소(Supabase) 검증: 나만 보는 체크 · 서버 저장 성공 후에만 반영 · 오류 안내 · 로컬 저장 없음.
// 진짜 서버 대신 가짜 클라이언트를 써요.   실행: node supabase/tests/visit-repository.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { createSupabaseVisitRepository } = await server.ssrLoadModule('/src/storage/supabaseVisitRepository.js')

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

const makeFake = (state = {}) => {
  const log = { inserts: [], deletes: [], invokes: [], queries: [] }
  const s = { session: { user: { id: 'me' } }, registered: true, rows: [], ...state }
  const result = async (q) => {
    log.queries.push(`${q.table}:${q.op}`)
    if (s.networkDown) throw new TypeError('Failed to fetch')
    if (q.table === 'bakeries') return { data: s.registered ? { id: q.filters.id } : null, error: null }
    if (q.op === 'insert') {
      log.inserts.push(q.payload)
      return { data: null, error: s.insertError ?? null }
    }
    if (q.op === 'delete') {
      log.deletes.push(q.filters)
      return { data: null, error: s.deleteError ?? null }
    }
    if (s.listError) return { data: null, error: s.listError }
    return { data: s.rows.filter((r) => !q.filters.user_id || r.user_id === q.filters.user_id), error: null }
  }
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      order: () => builder,
      limit: () => builder,
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      delete: () => ((q.op = 'delete'), builder),
      maybeSingle: () => result(q),
      then: (resolve, reject) => result(q).then(resolve, reject),
    }
    return builder
  }
  return {
    log,
    from,
    auth: { getSession: async () => ({ data: { session: s.session }, error: null }) },
    functions: {
      invoke: async (name, { body }) => {
        log.invokes.push({ name, body })
        if (s.invokeError) return { data: null, error: s.invokeError }
        s.registered = true
        return { data: { ok: true }, error: null }
      },
    },
  }
}
const repoFor = (state) => {
  const client = makeFake(state)
  return { client, repo: createSupabaseVisitRepository(async () => client) }
}
const invokeError = (status, body) => Object.assign(new Error('fn'), { context: { status, json: async () => body } })
const bakery = { id: 111, name: '테스트빵집', districtId: 'seomyeon', lat: 35.15, lng: 129.06, address: '부산' }

// ── 목록 ──
{
  const { repo } = repoFor({
    rows: [
      { user_id: 'me', bakery_id: '111', created_at: '2026-10-14T01:00:00Z', bakeries: { name: '테스트빵집', district_id: 'seomyeon', address: '부산 1' } },
      { user_id: 'other', bakery_id: '222', created_at: '2026-10-14T02:00:00Z', bakeries: { name: '남의 체크', district_id: 'haeundae', address: '' } },
    ],
  })
  const list = await repo.list()
  check('목록: 내 체크만, 이름 · 지역 · 주소 포함', list.length === 1 && list[0].bakeryId === '111' && list[0].name === '테스트빵집' && list[0].districtId === 'seomyeon' && list[0].address === '부산 1')
}
check('로그인하지 않으면 빈 목록(오류 아님)', (await repoFor({ session: null }).repo.list()).length === 0)
check('목록 조회 실패는 오류로 알려요', (await rejects(repoFor({ listError: { message: 'boom', code: 'XX000' } }).repo.list()))?.code === 'UNKNOWN')

// ── 체크하기 ──
{
  const { repo, client } = repoFor({})
  await repo.add(bakery)
  check('체크: 서버에는 빵집 ID만 보내요(작성자 · 날짜 · EXP 없음)', JSON.stringify(client.log.inserts[0]) === '{"bakery_id":"111"}', JSON.stringify(client.log.inserts))
  check('체크: 이미 등록된 빵집이면 등록 함수를 부르지 않아요', client.log.invokes.length === 0)
}
{
  const { repo, client } = repoFor({ registered: false })
  await repo.add(bakery)
  const call = client.log.invokes[0]
  check('체크: 처음 보는 빵집은 서버가 카카오로 확인해 등록한 뒤 체크', call?.name === 'register-bakery' && call.body.id === '111' && call.body.lat === 35.15 && client.log.inserts.length === 1)
}
{
  const { repo, client } = repoFor({ registered: false, invokeError: invokeError(404, null) })
  const error = await rejects(repo.add(bakery))
  check('빵집 확인 함수가 없으면 안내하고 체크하지 않아요', error?.code === 'FUNCTION_MISSING' && client.log.inserts.length === 0 && !/일지/.test(error.message))
}
{
  const { repo, client } = repoFor({ registered: false, invokeError: invokeError(400, { error: { message: '실제 제과 · 베이커리로 확인되지 않았어요.' } }) })
  const error = await rejects(repo.add(bakery))
  check('서버가 빵집을 거절하면 이유를 보여주고 체크하지 않아요', error?.code === 'BAKERY_REJECTED' && client.log.inserts.length === 0)
}
{
  const { repo } = repoFor({ insertError: { code: '23505', message: 'duplicate key' } })
  check('이미 체크한 빵집은 그대로 성공(중복 오류 아님)', (await rejects(repo.add(bakery))) === null)
}
for (const [label, insertError, expected] of [
  ['이메일 미인증', { message: 'EMAIL_NOT_VERIFIED', code: '42501' }, 'EMAIL_NOT_CONFIRMED'],
  ['로그인 만료', { message: 'JWT expired', code: 'PGRST301' }, 'SESSION_EXPIRED'],
  ['등록 안 된 빵집(FK)', { code: '23503', message: 'fk' }, 'INVALID_BAKERY'],
  ['알 수 없는 오류', { message: 'boom', code: 'XX000' }, 'UNKNOWN'],
]) {
  const error = await rejects(repoFor({ insertError }).repo.add(bakery))
  check(`체크 오류 안내: ${label}`, error?.code === expected && /[가-힣]/.test(error.message), String(error?.code))
}
{
  const { repo, client } = repoFor({ networkDown: true })
  const error = await rejects(repo.add(bakery))
  check('서버 연결 실패 → "저장되지 않았어요" 안내, 체크하지 않음', error?.code === 'NETWORK' && /저장되지 않았어요/.test(error.message) && client.log.inserts.length === 0)
}
check('로그인하지 않으면 체크할 수 없어요', (await rejects(repoFor({ session: null }).repo.add(bakery)))?.code === 'NOT_SIGNED_IN')

// ── 취소 ──
{
  const { repo, client } = repoFor({})
  await repo.remove(111)
  check('취소: 내 체크만 지워요(빵집 + 사용자 조건)', client.log.deletes[0].bakery_id === '111' && client.log.deletes[0].user_id === 'me')
}
check('취소 실패는 오류로 알려요', (await rejects(repoFor({ deleteError: { message: 'x', code: 'XX000' } }).repo.remove('1')))?.code === 'UNKNOWN')
check('로그인하지 않으면 취소할 수 없어요', (await rejects(repoFor({ session: null }).repo.remove('1')))?.code === 'NOT_SIGNED_IN')

check('이 모든 시나리오에서 localStorage에 아무것도 쓰지 않았어요', localWrites.length === 0, JSON.stringify(localWrites))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
