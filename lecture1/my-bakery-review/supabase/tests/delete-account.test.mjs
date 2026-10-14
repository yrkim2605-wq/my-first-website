// delete-account(회원 탈퇴 서버 함수)의 판단 로직 검증. Supabase는 가짜로 바꿔서 실제 서버를 부르지 않아요.
// 실행: node supabase/tests/delete-account.test.mjs   (Node의 TypeScript 지원으로 .ts를 그대로 불러와요)

import { REAUTH_WINDOW_SECONDS, handleRequest, lastAuthenticatedAt } from '../functions/delete-account/index.ts'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const NOW = 1_800_000_000
const makeJwt = (amr) => `h.${Buffer.from(JSON.stringify({ sub: 'u1', amr })).toString('base64url')}.s`
const freshJwt = makeJwt([{ method: 'password', timestamp: NOW - 30 }])
const staleJwt = makeJwt([{ method: 'password', timestamp: NOW - REAUTH_WINDOW_SECONDS - 5 }])

const request = (jwt, body = { confirm: true }, method = 'POST') =>
  new Request('https://example.test/delete-account', {
    method,
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })

const makeDeps = (over = {}) => {
  const calls = []
  const deps = {
    now: () => NOW,
    getUser: async () => ({ id: 'u1' }),
    deletePhotos: async (id) => calls.push(['photos', id]),
    deleteUser: async (id) => calls.push(['user', id]),
    log: (step, detail) => calls.push(['log', step, detail]),
    ...over,
  }
  return { deps, calls }
}
const run = async (jwt, over, body, method) => {
  const { deps, calls } = makeDeps(over)
  const res = await handleRequest(request(jwt, body, method), deps)
  return { res, calls, json: await res.json().catch(() => null) }
}

// ── 토큰에서 최근 인증 시각 읽기 ──
check('amr에서 가장 최근 인증 시각을 읽어요', lastAuthenticatedAt(makeJwt([{ timestamp: 100 }, { timestamp: 300 }, { timestamp: 200 }])) === 300)
check('amr이 없으면 null', lastAuthenticatedAt(makeJwt(undefined)) === null)
check('깨진 토큰은 null', lastAuthenticatedAt('abc') === null)

// ── 정상 ──
{
  const { res, calls } = await run(freshJwt)
  const order = calls.map(([name]) => name).join(',')
  check('정상: 사진 → 계정 순서로 지우고 200', res.status === 200 && order === 'photos,user', `${res.status} ${order}`)
  check('토큰의 주인(u1)만 지워요', calls.every(([name, id]) => name === 'log' || id === 'u1'))
}
{
  // 요청에 다른 사람 id를 실어도 쓰지 않아요
  const { calls } = await run(freshJwt, {}, { confirm: true, userId: 'victim', id: 'victim', user_id: 'victim' })
  check('요청에 다른 사용자 id를 실어도 무시', calls.filter(([name]) => name !== 'log').every(([, id]) => id === 'u1'))
}

// ── 거절 ──
{
  const { res, calls } = await run(null)
  check('토큰이 없으면 401 + 아무것도 지우지 않아요', res.status === 401 && calls.length === 0)
}
{
  const { res, calls } = await run(freshJwt, { getUser: async () => null })
  check('확인되지 않은 토큰(위조 · 만료 · publishable 키)이면 401', res.status === 401 && calls.length === 0)
}
{
  const { res, calls } = await run(freshJwt, { getUser: async () => { throw new Error('auth down') } })
  check('인증 서버 오류면 열어 주지 않아요 (401)', res.status === 401 && calls.length === 0)
}
{
  const { res, json, calls } = await run(staleJwt)
  check('오래전에 로그인한 세션이면 403 REAUTH_REQUIRED', res.status === 403 && json.error.code === 'REAUTH_REQUIRED' && calls.length === 0)
}
{
  const { res, calls } = await run(makeJwt(undefined))
  check('인증 시각 기록이 없는 토큰도 403', res.status === 403 && calls.length === 0)
}
{
  const { res, json, calls } = await run(freshJwt, {}, {})
  check('confirm이 없으면 400', res.status === 400 && json.error.code === 'CONFIRM_REQUIRED' && calls.length === 0)
}
{
  const { res, calls } = await run(freshJwt, {}, { confirm: 'true' })
  check('confirm이 true(불리언)가 아니면 400', res.status === 400 && calls.length === 0)
}
{
  const { res } = await run(freshJwt, {}, 'not json')
  check('JSON이 아니면 400', res.status === 400)
}
{
  const { res } = await run(freshJwt, {}, { confirm: true, pad: 'x'.repeat(2000) })
  check('너무 큰 요청은 413', res.status === 413)
}
{
  const { res, calls } = await run(freshJwt, {}, null, 'GET')
  check('POST가 아니면 405', res.status === 405 && calls.length === 0)
}
{
  const { res } = await run(null, {}, null, 'OPTIONS')
  check('OPTIONS(브라우저 사전 확인)는 200', res.status === 200)
}

// ── 실패 대응 ──
{
  const { res, json, calls } = await run(freshJwt, { deletePhotos: async () => { throw Object.assign(new Error('storage down'), { code: 'X' }) } })
  check('사진 삭제가 실패하면 계정은 지우지 않고 500 PHOTO_CLEANUP_FAILED', res.status === 500 && json.error.code === 'PHOTO_CLEANUP_FAILED' && !calls.some(([name]) => name === 'user'))
  check('실패한 단계가 서버 로그에 남아요 (응답에는 없어요)', calls.some(([name, step]) => name === 'log' && step === 'delete-photos') && !JSON.stringify(json).includes('storage down'))
}
{
  const { res, json, calls } = await run(freshJwt, { deleteUser: async () => { throw new Error('db down') } })
  check('계정 삭제가 실패하면 500 DELETE_FAILED (사진은 이미 정리됨 → 재시도 안내)', res.status === 500 && json.error.code === 'DELETE_FAILED' && calls.some(([name]) => name === 'photos'))
  check('응답에 내부 오류 내용이 없어요', !JSON.stringify(json).includes('db down'))
}
{
  const { res, json } = await run(freshJwt, { deletePhotos: async () => { throw 'boom' }, log: () => { throw new Error('log broken') } })
  check('로그를 못 남겨도 정상적으로 오류 응답', res.status === 500 && json.error.code === 'PHOTO_CLEANUP_FAILED')
}
{
  // 다시 시도: 첫 시도에서 계정 삭제 실패 → 두 번째는 성공 (사진 삭제를 두 번 해도 안전해야 해요)
  let attempts = 0
  const over = { deleteUser: async () => { attempts += 1; if (attempts === 1) throw new Error('temporary') } }
  const first = await run(freshJwt, over)
  const second = await run(freshJwt, over)
  check('재시도하면 성공해요', first.res.status === 500 && second.res.status === 200)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
