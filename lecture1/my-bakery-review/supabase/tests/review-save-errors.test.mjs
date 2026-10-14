// 리뷰 저장 실패 원인 구분 검증: 빵집 확인 서버 함수 · 일지 저장(DB) · 권한 · 연결 오류를 단계별로 안내하는지,
// 개발용 오류 출력에 단계 · 상태 · 코드 · 메시지가 담기는지, 글자 수 규칙이 서버로 보내기 전에 먼저 적용되는지 확인해요.
// 진짜 서버 대신 가짜 클라이언트를 써요.   실행: node supabase/tests/review-save-errors.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const { createSupabaseReviewRepository } = await server.ssrLoadModule('/src/storage/supabaseReviewRepository.js')
const shared = await server.ssrLoadModule('/src/storage/supabaseShared.js')
const localRepo = await server.ssrLoadModule('/src/storage/reviewRepository.js')

const logs = []
shared.setDebugLogger((info) => logs.push(info))

// 연결 진단(probe)이 쓰는 fetch를 가짜로 바꿔요. 기본은 "서버에 못 닿음"이에요.
const fetchCalls = []
let fetchBehavior = () => Promise.reject(new TypeError('Failed to fetch'))
globalThis.fetch = (url, init) => {
  fetchCalls.push({ url: String(url), init })
  return fetchBehavior(String(url), init)
}

const store = {}
globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] }

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

const ENOUGH = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
const rep = (text, n) => text.repeat(n)

const makeFake = (state = {}) => {
  const log = { inserts: [], updates: [], invokes: [], queries: [] }
  const s = { session: { user: { id: 'me' } }, registered: false, ...state }
  const result = async (q) => {
    log.queries.push(q.table + ':' + q.op)
    if (s.networkDown) throw new TypeError('Failed to fetch')
    if (q.table === 'bakeries') return { data: s.registered ? { id: q.filters.id } : null, error: null }
    if (q.op === 'insert') {
      log.inserts.push(q.payload)
      if (s.insertError) return { data: null, error: s.insertError }
      return { data: { id: 'new', user_id: 'me', bakery_id: q.payload.bakery_id, rating: q.payload.rating, content: q.payload.content, photo_path: null, exp_review: true, exp_photo: false, created_at: '2026-10-14T00:00:00Z', updated_at: '2026-10-14T00:00:00Z', profiles: { nickname: '나' }, bakeries: { name: '빵집', district_id: 'seomyeon' } }, error: null }
    }
    if (q.op === 'update') {
      log.updates.push(q.payload)
      return { data: { id: 'r1', user_id: 'me', bakery_id: 'b', rating: 4, content: q.payload.content ?? '기존', photo_path: null, exp_review: true, exp_photo: false, created_at: '2026-10-14T00:00:00Z', updated_at: '2026-10-14T00:00:00Z', profiles: { nickname: '나' }, bakeries: { name: '빵집', district_id: 'seomyeon' } }, error: null }
    }
    // select (수정 전 조회)
    return { data: { id: 'r1', photo_path: null }, error: null }
  }
  const from = (table) => {
    const q = { table, op: 'select', filters: {}, payload: null }
    const builder = {
      select: () => builder,
      eq: (key, value) => ((q.filters[key] = value), builder),
      insert: (payload) => ((q.op = 'insert'), (q.payload = payload), builder),
      update: (payload) => ((q.op = 'update'), (q.payload = payload), builder),
      maybeSingle: () => result(q),
      single: () => result(q),
      then: (resolve, reject) => result(q).then(resolve, reject),
    }
    return builder
  }
  return {
    log,
    from,
    ...(s.noFunctionsUrl ? {} : { functionsUrl: new URL('https://x.supabase.co/functions/v1') }),
    ...(s.withKey ? { supabaseKey: 'sb_publishable_test_key' } : {}),
    auth: { getSession: async () => ({ data: { session: s.session && s.token ? { ...s.session, access_token: s.token } : s.session }, error: null }) },
    storage: { from: () => ({ getPublicUrl: (p) => ({ data: { publicUrl: 'https://cdn.test/' + p } }), upload: async () => ({ data: {}, error: null }), remove: async () => ({}) }) },
    functions: {
      invoke: async (name, options) => {
        const { body } = options
        log.invokes.push({ name, body, timeout: options.timeout })
        if (s.invokeError) return { data: null, error: s.invokeError }
        s.registered = true
        return { data: { ok: true }, error: null }
      },
    },
  }
}
const repoFor = (state) => {
  const client = makeFake(state)
  return { client, repo: createSupabaseReviewRepository(async () => client) }
}
const baseInput = { bakeryId: '111', bakerySource: 'kakao', bakeryName: '테스트빵집', districtId: 'seomyeon', bakeryLat: 35.15, bakeryLng: 129.06, bakeryAddress: '부산', rating: 5, content: ENOUGH }
const fnError = (status, code, message = '서버 메시지') =>
  Object.assign(new Error('Edge Function returned a non-2xx status code'), { name: 'FunctionsHttpError', context: { status, json: async () => ({ error: { code, message } }) } })

// ── 1. 빵집 확인 서버 함수(register-bakery) 오류: 원인별 안내 ──
const fnCases = [
  ['카카오 연결 실패(502)', fnError(502, 'KAKAO_UNAVAILABLE'), 'KAKAO_UNAVAILABLE', /카카오/],
  ['서버 설정 누락(500 NOT_CONFIGURED)', fnError(500, 'NOT_CONFIGURED'), 'FUNCTION_NOT_CONFIGURED', /준비하는 중/],
  ['서버 DB 권한 부족(500 DB_PERMISSION, 실제로 겪은 오류)', fnError(500, 'DB_PERMISSION'), 'FUNCTION_DB_PERMISSION', /서비스 설정에 문제/],
  ['서버 내부 오류(500)', fnError(500, 'INTERNAL'), 'FUNCTION_ERROR', /register\/500\/INTERNAL/],
  ['요청이 너무 큼(413)', fnError(413, 'TOO_LARGE'), 'TOO_LARGE', /너무 커/],
  ['호출이 너무 많음(429)', fnError(429, 'RATE_LIMITED'), 'RATE_LIMITED', /너무 많아/],
  ['이메일 미인증(403)', fnError(403, 'EMAIL_NOT_VERIFIED'), 'EMAIL_NOT_CONFIRMED', /이메일 인증/],
  ['로그인 만료(401)', fnError(401, 'NOT_SIGNED_IN'), 'SESSION_EXPIRED', /로그인/],
  ['함수가 배포되지 않음(404)', fnError(404, null), 'FUNCTION_MISSING', /빵집을 확인하는 기능/],
  ['카카오가 빵집으로 인정하지 않음(400)', fnError(400, 'BAKERY_NOT_FOUND', '실제 제과 · 베이커리로 확인되지 않았어요.'), 'BAKERY_REJECTED', /확인되지/],
  ['서버에 닿지 못함(진단도 실패 → 이 브라우저가 못 닿음)', Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError', context: new TypeError('Failed to fetch') }), 'FUNCTION_NETWORK_BLOCKED', /이 브라우저에서 서버/],
]
for (const [label, invokeError, expectedCode, pattern] of fnCases) {
  logs.length = 0
  const { repo, client } = repoFor({ invokeError })
  const error = await rejects(repo.create(baseInput))
  check(`빵집 확인 오류 안내: ${label}`, error?.code === expectedCode && pattern.test(error.message) && client.log.inserts.length === 0 && !/^저장하지 못했어요\. 잠시 후 다시 시도해 주세요\.$/.test(error.message), `${error?.code} ${error?.message}`)
  check(`  └ 개발용 정보: 단계=register · 출처=function`, error?.debug?.step === 'register' && error.debug.source === 'function' && logs.length === 1 && logs[0].step === 'register', JSON.stringify(error?.debug))
}
{
  logs.length = 0
  const { repo } = repoFor({ invokeError: fnError(502, 'KAKAO_UNAVAILABLE', '서버 쪽 설명') })
  const error = await rejects(repo.create(baseInput))
  check('개발용 정보에 HTTP 상태 · 서버 오류 코드 · 서버 메시지가 담겨요', error.debug.status === 502 && error.debug.serverCode === 'KAKAO_UNAVAILABLE' && error.debug.serverMessage === '서버 쪽 설명')
}

{
  const JARGON = /KAKAO_REST_API_KEY|0007_|0001~|마이그레이션|Verify JWT|CORS|Edge Functions|register-bakery|서버 관리자|service_role/
  for (const [label, invokeError] of [
    ['NOT_CONFIGURED', fnError(500, 'NOT_CONFIGURED')],
    ['DB_PERMISSION', fnError(500, 'DB_PERMISSION')],
    ['404', fnError(404, null)],
    ['502', fnError(502, 'KAKAO_UNAVAILABLE')],
  ]) {
    const { repo } = repoFor({ invokeError })
    const error = await rejects(repo.create(baseInput))
    check(`사용자에게 보이는 안내에 기술 용어가 없어요: ${label}`, !JARGON.test(error.message) && /문의처|잠시 후/.test(error.message), error.message)
    check(`  └ 기술 안내는 debug.operatorHint에 있어요: ${label}`, typeof error.debug.operatorHint === 'string' && error.debug.operatorHint.length > 0)
  }
  const { repo: repoA } = repoFor({ invokeError: fnError(500, 'NOT_CONFIGURED') })
  check('운영자 안내에는 설정 이름이 있어요 (KAKAO_REST_API_KEY)', /KAKAO_REST_API_KEY/.test((await rejects(repoA.create(baseInput))).debug.operatorHint))
  const { repo: repoB } = repoFor({ invokeError: fnError(500, 'DB_PERMISSION') })
  check('운영자 안내에는 마이그레이션 파일명이 있어요 (0007)', /0007_service_role_grants/.test((await rejects(repoB.create(baseInput))).debug.operatorHint))
}

// ── 1-2. 연결 오류(상태 없음)의 원인 진단 ──
{
  const fetchError = () => Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError', context: new TypeError('Failed to fetch') })

  // (가) 로그인 정보 없는 단순 요청은 서버가 응답 → 서버는 살아 있고 인증 헤더가 있는 요청만 막힌 경우
  fetchCalls.length = 0
  fetchBehavior = () => Promise.resolve({ status: 401 })
  logs.length = 0
  let t = repoFor({ invokeError: fetchError() })
  let error = await rejects(t.repo.create(baseInput))
  check('진단: 단순 요청은 응답 → "서버는 응답하는데 로그인 정보가 담긴 요청이 막혔어요"', error?.code === 'FUNCTION_REQUEST_BLOCKED' && /서버는 응답/.test(error.message) && /로그아웃했다가 다시 로그인/.test(error.message), `${error?.code} ${error?.message}`)
  check('진단: 진단 요청은 로그인 정보 · 키 없이 보내요 (POST · text/plain · 헤더 1개)', fetchCalls.length === 1 && fetchCalls[0].url === 'https://x.supabase.co/functions/v1/register-bakery' && fetchCalls[0].init.method === 'POST' && JSON.stringify(Object.keys(fetchCalls[0].init.headers)) === '["Content-Type"]' && fetchCalls[0].init.body === '{}')
  check('개발용 정보에 원래 원인(TypeError: Failed to fetch)과 진단 결과가 담겨요', error.debug.cause === 'TypeError: Failed to fetch' && error.debug.probe.includes('단순 요청은 응답함') && error.debug.probe.includes('HTTP 401') && logs[0].probe === error.debug.probe)
  check('진단 결과가 나와도 저장 요청은 보내지 않아요', t.client.log.inserts.length === 0)

  // (나) 단순 요청도 실패 → 이 브라우저가 서버에 못 닿음
  fetchBehavior = () => Promise.reject(new TypeError('Failed to fetch'))
  t = repoFor({ invokeError: fetchError() })
  error = await rejects(t.repo.create(baseInput))
  check('진단: 단순 요청도 실패 → "이 브라우저에서 서버에 연결되지 않아요(VPN · 차단 확장 프로그램 확인)"', error?.code === 'FUNCTION_NETWORK_BLOCKED' && /VPN/.test(error.message) && /단순 요청도 실패/.test(error.debug.probe), `${error?.code} ${error?.debug?.probe}`)

  // (가-2) 인증 헤더가 있는 진단 요청까지 응답 → 서버가 로그인 사용자의 요청을 처리하다 응답을 못 준 경우(함수 오류 · 시간 초과)
  fetchCalls.length = 0
  fetchBehavior = () => Promise.resolve({ status: 401 })
  t = repoFor({ invokeError: fetchError(), withKey: true })
  error = await rejects(t.repo.create(baseInput))
  check('진단 2단계: 인증 헤더 요청도 응답 → "서버가 응답하지 못했어요(Edge Functions Logs 확인)"', error?.code === 'FUNCTION_NO_RESPONSE' && /문의처/.test(error.message) && /Logs/.test(error.debug.operatorHint) && error.debug.probe.includes('인증 헤더 요청도 응답함'), `${error?.code} ${error?.debug?.probe}`)
  const second = fetchCalls[1]
  check('진단 2단계 요청: 공개 키만 쓰고(로그인 토큰 아님) 아무것도 바꾸지 않는 빈 요청', fetchCalls.length === 2 && second.init.headers.Authorization === 'Bearer sb_publishable_test_key' && second.init.headers.apikey === 'sb_publishable_test_key' && second.init.body === '{}')

  // (가-3) 인증 헤더 진단만 실패 → 브라우저가 인증 헤더 요청을 막은 경우
  let call = 0
  fetchBehavior = () => (++call === 1 ? Promise.resolve({ status: 401 }) : Promise.reject(new TypeError('Failed to fetch')))
  t = repoFor({ invokeError: fetchError(), withKey: true })
  error = await rejects(t.repo.create(baseInput))
  check('진단 2단계: 인증 헤더 요청만 실패 → "브라우저가 로그인 정보가 담긴 요청을 막았어요"', error?.code === 'FUNCTION_HEADERS_BLOCKED' && /시크릿 창/.test(error.message) && error.debug.probe.includes('인증 헤더 요청은 실패'), `${error?.code} ${error?.debug?.probe}`)

  // (가-4) 시간 제한: 25초 안에 안 오면 끊어요
  fetchBehavior = () => Promise.resolve({ status: 401 })
  t = repoFor({ invokeError: Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError', context: Object.assign(new Error('aborted'), { name: 'AbortError' }) }), withKey: true })
  error = await rejects(t.repo.create(baseInput))
  check('시간 초과(AbortError) → "응답이 너무 늦어요(25초)"', error?.code === 'FUNCTION_TIMEOUT' && /25초/.test(error.message), `${error?.code}`)
  check('빵집 확인 요청에는 25초 시간 제한을 걸어요', t.client.log.invokes[0].timeout === 25000)
  check('개발용 정보에 걸린 시간(ms)이 담겨요', typeof error.debug.elapsedMs === 'number' && error.debug.elapsedMs >= 0)
  fetchBehavior = () => Promise.reject(new TypeError('Failed to fetch'))

  // (가-5) 실제 로그인 토큰으로 어디까지 가는지 재기 (3 · 4단계)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const token = `${b64({ alg: 'ES256', typ: 'JWT' })}.${b64({ role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3000 })}.sig`
  const withToken = (init) => String(init?.headers?.Authorization ?? '').includes(token)
  const runToken = async (behavior) => {
    fetchCalls.length = 0
    fetchBehavior = behavior
    const run = repoFor({ invokeError: fetchError(), withKey: true, token })
    const err = await rejects(run.repo.create(baseInput))
    return { err, run, calls: [...fetchCalls] }
  }

  // 토큰 GET부터 실패 → 토큰이 담긴 요청이 게이트웨이/브라우저에서 막힘
  let r = await runToken((url, init) => (withToken(init) ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve({ status: 401 })))
  check('진단 3단계: 토큰 GET이 실패 → "로그인 토큰이 담긴 요청이 막혀요"', r.err?.code === 'FUNCTION_TOKEN_BLOCKED' && r.err.debug.probe.includes('토큰 GET 실패') && !r.calls.some((c) => c.init.method === 'POST' && withToken(c.init)), r.err?.code)

  // 토큰 GET은 통과, 토큰 POST{}가 실패 → 서버가 로그인 확인 단계에서 응답을 못 줌
  r = await runToken((url, init) => (withToken(init) && init.method === 'POST' ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve({ status: withToken(init) ? 405 : 401 })))
  check('진단 4단계: 토큰 POST{}가 실패 → "로그인 정보를 확인하는 단계에서 응답하지 못해요"', r.err?.code === 'FUNCTION_AUTH_NO_RESPONSE' && r.err.debug.probe.includes('토큰 GET→HTTP 405') && r.err.debug.probe.includes('토큰 POST{} 실패'), r.err?.code)

  // 토큰 POST{}까지 정상(400) → 실제 등록 처리(카카오 · DB) 중에 끊김
  r = await runToken((url, init) => Promise.resolve({ status: withToken(init) ? (init.method === 'GET' ? 405 : 400) : 401 }))
  check('진단 4단계: 토큰 POST{}가 정상(400) → "빵집 확인 · 등록 처리 중에 응답이 끊겼어요(Logs 확인)"', r.err?.code === 'FUNCTION_PROCESS_FAILED' && /문의처/.test(r.err.message) && /Logs/.test(r.err.debug.operatorHint) && r.err.debug.probe.includes('토큰 POST{}→HTTP 400'), r.err?.code)
  check('진단 정보에 토큰 종류와 남은 시간만 있고 토큰 값은 없어요', r.err.debug.probe.includes('토큰 알고리즘=ES256') && r.err.debug.probe.includes('역할=authenticated') && r.err.debug.probe.includes('만료까지=') && r.err.debug.probe.includes('초') && !JSON.stringify(r.err.debug).includes(token) && !JSON.stringify(logs).includes(token))
  const tokenCalls = r.calls.filter((c) => withToken(c.init))
  check('토큰을 쓰는 진단 요청은 GET 1번 + 빈 본문 POST 1번뿐이에요 (데이터를 바꾸는 요청 없음)', tokenCalls.length === 2 && tokenCalls[0].init.method === 'GET' && tokenCalls[1].init.method === 'POST' && tokenCalls[1].init.body === '{}' && r.run.client.log.inserts.length === 0)
  check('진단 요청은 모두 같은 함수 주소(register-bakery)로만 가요', r.calls.every((c) => c.url === 'https://x.supabase.co/functions/v1/register-bakery'))
  fetchBehavior = () => Promise.reject(new TypeError('Failed to fetch'))

  // (다) 진단할 수 없으면(함수 주소를 모름) 예전의 일반 안내
  t = repoFor({ invokeError: fetchError(), noFunctionsUrl: true })
  error = await rejects(t.repo.create(baseInput))
  check('진단 불가 → 일반 연결 안내', error?.code === 'FUNCTION_UNREACHABLE' && error.debug.probe === '확인하지 못함')

  // (라) HTTP 상태가 있는 오류에는 진단 요청을 보내지 않아요
  fetchCalls.length = 0
  t = repoFor({ invokeError: fnError(502, 'KAKAO_UNAVAILABLE') })
  await rejects(t.repo.create(baseInput))
  check('상태가 있는 서버 오류(502 등)에는 진단 요청을 보내지 않아요', fetchCalls.length === 0)
  fetchBehavior = () => Promise.reject(new TypeError('Failed to fetch'))
}

// ── 2. 일지 저장(insert) 오류: 원인별 안내 ──
const dbCases = [
  ['권한 없음(RLS)', { code: '42501', message: 'new row violates row-level security policy for table "reviews"' }, 'FORBIDDEN', /저장할 권한/],
  ['서버 칸이 앱과 안 맞음(PGRST204)', { code: 'PGRST204', message: "Could not find the 'x' column of 'reviews' in the schema cache" }, 'SCHEMA_MISMATCH', /서비스 설정에 문제/],
  ['연결 관계를 못 찾음(PGRST200)', { code: 'PGRST200', message: 'Could not find a relationship' }, 'SCHEMA_MISMATCH', /서비스 설정에 문제/],
  ['없는 칸(42703)', { code: '42703', message: 'column does not exist' }, 'SCHEMA_MISMATCH', /서비스 설정에 문제/],
  ['서버의 글자 수 검사(너무 짧음)', { code: '23514', message: 'REVIEW_TOO_SHORT' }, 'CONTENT_TOO_SHORT', /20자 이상/],
  ['서버의 글자 수 검사(너무 김)', { code: '23514', message: 'REVIEW_TOO_LONG' }, 'CONTENT_TOO_LONG', /500자 이하/],
  ['다른 입력값 제약(별점 등)', { code: '23514', message: 'new row violates check constraint' }, 'INVALID_INPUT', /별점과 내용/],
  ['값 형식 오류(22P02)', { code: '22P02', message: 'invalid input syntax' }, 'INVALID_INPUT', /별점과 내용/],
  ['필수 값 누락(23502)', { code: '23502', message: 'null value violates not-null constraint' }, 'INVALID_INPUT', /별점과 내용/],
  ['이미 쓴 빵집(중복)', { code: '23505', message: 'duplicate key' }, 'DUPLICATE_REVIEW', /이미 이 빵집/],
  ['등록되지 않은 빵집(FK)', { code: '23503', message: 'fk' }, 'INVALID_BAKERY', /등록되지 않은/],
  ['하루 작성 한도', { code: 'P0001', message: 'DAILY_REVIEW_LIMIT' }, 'DAILY_REVIEW_LIMIT', /하루 20개/],
  ['이메일 미인증(서버)', { code: '42501', message: 'EMAIL_NOT_VERIFIED' }, 'EMAIL_NOT_CONFIRMED', /이메일 인증/],
  ['로그인 만료', { code: 'PGRST301', message: 'JWT expired' }, 'SESSION_EXPIRED', /로그인/],
]
for (const [label, insertError, expectedCode, pattern] of dbCases) {
  logs.length = 0
  const { repo, client } = repoFor({ registered: true, insertError })
  const error = await rejects(repo.create(baseInput))
  check(`일지 저장 오류 안내: ${label}`, error?.code === expectedCode && pattern.test(error.message) && client.log.inserts.length === 1, `${error?.code} ${error?.message}`)
  check(`  └ 개발용 정보: 단계=insert · 코드=${insertError.code}`, error?.debug?.step === 'insert' && error.debug.code === insertError.code && logs.length === 1, JSON.stringify(error?.debug))
}
{
  logs.length = 0
  const { repo } = repoFor({ registered: true, insertError: { code: 'XX000', message: 'boom internal', details: 'some detail', hint: 'some hint' } })
  const error = await rejects(repo.create(baseInput))
  check('알 수 없는 오류: 안내 + 짧은 오류 코드(insert/XX000)를 같이 보여줘요', error?.code === 'UNKNOWN' && error.message.startsWith('저장하지 못했어요.') && error.message.includes('(오류 코드: insert/XX000)'), error?.message)
  check('개발용 출력: 단계 · 코드 · 메시지 · 상세 · 힌트가 모두 담겨요', logs.length === 1 && logs[0].step === 'insert' && logs[0].code === 'XX000' && logs[0].message === 'boom internal' && logs[0].details === 'some detail' && logs[0].hint === 'some hint' && logs[0].userCode === 'UNKNOWN')
  check('개발용 출력에 로그인 토큰 · 키 같은 값은 없어요', !/token|secret|apikey|bearer/i.test(JSON.stringify(logs[0])))
}
{
  const { repo, client } = repoFor({ networkDown: true })
  const error = await rejects(repo.create(baseInput))
  check('인터넷이 끊기면 연결 안내(저장 안 됨)', error?.code === 'NETWORK' && /저장되지 않았어요/.test(error.message) && client.log.inserts.length === 0)
}
{
  const { repo, client } = repoFor({ registered: true, insertError: { code: 'XX000', message: 'boom' } })
  await rejects(repo.create(baseInput))
  check('실패해도 자동으로 다시 저장하지 않아요 (일지 · EXP 중복 방지)', client.log.inserts.length === 1 && client.log.invokes.length === 0)
}

// ── 3. 글자 수 규칙은 서버로 보내기 전에 먼저 적용돼요 ──
{
  const cases = [
    ['19자', rep('가', 19), 'CONTENT_TOO_SHORT'],
    ['공백만', rep(' ', 30), 'CONTENT_TOO_SHORT'],
    ['19자 + 공백', rep('가', 19) + rep(' ', 40), 'CONTENT_TOO_SHORT'],
    ['501자', rep('가', 501), 'CONTENT_TOO_LONG'],
  ]
  for (const [label, content, code] of cases) {
    const { repo, client } = repoFor()
    const error = await rejects(repo.create({ ...baseInput, content }))
    check(`작성: ${label} → 서버 요청 없이 거절`, error?.code === code && client.log.queries.length === 0 && client.log.invokes.length === 0 && client.log.inserts.length === 0, `${error?.code}`)
  }
  for (const [label, content] of [['20자', rep('가', 20)], ['500자', rep('가', 500)], ['글자마다 띄어 쓴 20자', rep('가 ', 19) + '가']]) {
    const { repo, client } = repoFor({ registered: true })
    const error = await rejects(repo.create({ ...baseInput, content }))
    check(`작성: ${label} → 저장 요청을 보내요`, error === null && client.log.inserts.length === 1)
  }
  const { repo, client } = repoFor({ registered: true })
  await repo.create({ ...baseInput, content: '   ' + rep('나', 20) + '   ' })
  check('작성: 서버에는 앞뒤 공백을 뺀 내용을 보내요', client.log.inserts[0].content === rep('나', 20))
}
{
  const { repo, client } = repoFor()
  const error = await rejects(repo.update('r1', 'me', { content: rep('가', 19) }))
  check('수정: 19자 → 요청 없이 거절', error?.code === 'CONTENT_TOO_SHORT' && client.log.updates.length === 0 && client.log.queries.length === 0)
  const ok = repoFor()
  await ok.repo.update('r1', 'me', { content: rep('가', 20) })
  check('수정: 20자 통과', ok.client.log.updates.length === 1)
  const ratingOnly = repoFor()
  await ratingOnly.repo.update('r1', 'me', { rating: 3 })
  check('수정: 내용을 보내지 않는 요청(별점만)은 글자 수를 검사하지 않아요', ratingOnly.client.log.updates.length === 1 && !('content' in ratingOnly.client.log.updates[0]))
}

// ── 4. 로컬 모드도 같은 규칙, 이미 저장된 짧은 일지는 그대로 ──
{
  const local = localRepo.reviewRepository
  store['my-bakery-review:v1:reviews'] = JSON.stringify({ version: 1, reviews: [{ id: 'old', userId: 'u1', authorNickname: '나', bakeryId: '1', bakerySource: 'kakao', bakeryName: '옛 빵집', districtId: null, rating: 4, content: '짧은 옛 일지', photo: null, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }] })
  const base = { userId: 'u1', authorNickname: '나', bakeryId: '2', bakerySource: 'kakao', bakeryName: '빵집', districtId: null, rating: 5 }
  check('로컬: 19자 거절', (await rejects(local.create({ ...base, content: rep('가', 19) })))?.code === 'INVALID_CONTENT')
  check('로컬: 공백만 거절', (await rejects(local.create({ ...base, content: rep(' ', 30) })))?.code === 'INVALID_CONTENT')
  check('로컬: 501자 거절', (await rejects(local.create({ ...base, content: rep('가', 501) })))?.code === 'INVALID_CONTENT')
  check('로컬: 20자 · 500자 저장', (await rejects(local.create({ ...base, content: rep('가', 20) }))) === null && (await rejects(local.create({ ...base, bakeryId: '3', content: rep('가', 500) }))) === null)
  const list = await local.list()
  check('로컬: 기존 짧은 일지는 삭제 · 변경 없이 그대로', list.some((r) => r.id === 'old' && r.content === '짧은 옛 일지') && list.length === 3)
  check('로컬: 기존 짧은 일지도 고칠 때는 같은 규칙 (짧게 → 거절, 20자 → 통과)',
    (await rejects(local.update('old', 'u1', { content: '짧게' })))?.code === 'INVALID_CONTENT' && (await rejects(local.update('old', 'u1', { content: rep('고', 20) }))) === null)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
