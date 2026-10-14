// register-bakery(빵집 등록 서버 함수)의 판단 로직 검증. 카카오 · Supabase는 가짜로 바꿔서 실제 서버를 부르지 않아요.
// 실행: node supabase/tests/register-bakery.test.mjs   (Node의 TypeScript 지원으로 .ts를 그대로 불러와요)

import { DISTRICT_CENTERS, createRateLimiter, distanceKm, findBakeryDocument, handleRequest, resolveDistrict, validateInput } from '../functions/register-bakery/index.ts'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const good = { id: '12345678', name: '테스트 베이커리', districtId: 'haeundae', lat: 35.158, lng: 129.06 }

check('올바른 입력 통과', validateInput(good).ok === true)
check('ID 형식 오류 거부', validateInput({ ...good, id: 'abc' }).ok === false)
check('빈 이름 거부', validateInput({ ...good, name: '  ' }).ok === false)
check('클라이언트가 보낸 지역 값은 무시(결과에 없음)', validateInput(good).value.districtId === undefined)
check('좌표 범위 밖 거부', validateInput({ ...good, lat: 10 }).ok === false)
check('문자열 좌표 거부(NaN)', validateInput({ ...good, lat: 'x' }).ok === false)
check('숫자 ID도 문자열로 받아 통과', validateInput({ ...good, id: 12345678 }).ok === true)

check('거리 계산: 같은 점은 0', distanceKm(35, 129, 35, 129) === 0)
check('서면 근처 좌표 → 서면', resolveDistrict(35.158, 129.06) === 'seomyeon')
check('각 지역 중심은 자기 지역으로', Object.entries(DISTRICT_CENTERS).every(([id, c]) => resolveDistrict(c.lat, c.lng) === id))
check('부산 밖(서울) 좌표는 null', resolveDistrict(37.5665, 126.978) === null)

const docs = [
  { id: '1', place_name: '카페', category_name: '음식점 > 카페' },
  { id: '12345678', place_name: '진짜 베이커리', category_name: '음식점 > 간식 > 제과,베이커리', road_address_name: '부산 서구 1', x: '129.0601', y: '35.1581' },
]
check('같은 ID의 제과·베이커리를 찾아요', findBakeryDocument(docs, '12345678')?.place_name === '진짜 베이커리')
check('ID가 같아도 카테고리가 제과가 아니면 거부', findBakeryDocument([{ id: '9', category_name: '음식점 > 카페' }], '9') === null)
check('ID가 없으면 null', findBakeryDocument(docs, '999') === null)

// handleRequest 가짜 환경
const makeDeps = (over = {}) => {
  const calls = { kakao: 0, upserts: [] }
  const deps = {
    getUser: async (jwt) => (jwt === 'good' ? { id: 'u1', emailConfirmed: true } : jwt === 'unverified' ? { id: 'u2', emailConfirmed: false } : null),
    hasBakery: async () => false,
    upsertBakery: async (row) => calls.upserts.push(row),
    searchKakao: async () => {
      calls.kakao += 1
      return docs
    },
    ...over,
  }
  return { deps, calls }
}
const request = (body, token = 'good', method = 'POST') =>
  new Request('http://x/register-bakery', { method, headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}, body: method === 'GET' || body === undefined ? undefined : JSON.stringify(body) })
const run = async (req, over) => {
  const { deps, calls } = makeDeps(over)
  const res = await handleRequest(req, deps)
  return { status: res.status, body: await res.json(), calls }
}

{
  const r = await run(request(good, null))
  check('로그인 없이는 401', r.status === 401 && r.calls.kakao === 0)
}
{
  const r = await run(request(good, 'bad'))
  check('잘못된 토큰은 401', r.status === 401)
}
{
  const r = await run(request(good, 'unverified'))
  check('이메일 미인증은 403', r.status === 403 && r.body.error.code === 'EMAIL_NOT_VERIFIED')
}
{
  const r = await run(request({ ...good, id: 'x' }))
  check('잘못된 입력은 400이고 카카오를 부르지 않아요', r.status === 400 && r.calls.kakao === 0)
}
{
  const r = await run(request(good, 'good', 'GET'))
  check('POST가 아니면 405', r.status === 405)
}
// ── 앱이 연결 오류를 진단할 때 보내는 요청이 데이터를 건드리지 않는지 ──
{
  const touched = []
  const spyDeps = {
    getUser: async (jwt) => (touched.push('getUser'), jwt === 'good' ? { id: 'u1', emailConfirmed: true } : null),
    hasBakery: async () => (touched.push('hasBakery'), false),
    upsertBakery: async () => touched.push('upsertBakery'),
    searchKakao: async () => (touched.push('searchKakao'), docs),
    allowLookup: () => (touched.push('allowLookup'), true),
  }
  const send = async (req) => {
    touched.length = 0
    const res = await handleRequest(req, spyDeps)
    return { status: res.status, body: await res.json(), touched: [...touched] }
  }
  let r = await send(request(undefined, 'good', 'GET'))
  check('진단 GET: 로그인 확인 전에 405로 끝나고 아무것도 호출하지 않아요', r.status === 405 && r.touched.length === 0)
  r = await send(request({}, 'good'))
  check('진단 POST {} (로그인 사용자): 로그인 확인 후 입력 검증(400)에서 끝나고 빵집 조회 · 카카오 · DB 등록을 하지 않아요', r.status === 400 && r.body.error.code === 'INVALID_INPUT' && r.touched.join(',') === 'getUser', r.touched.join(','))
  r = await send(request({}, null))
  check('진단 POST (로그인 없음): 401로 끝나고 아무것도 호출하지 않아요', r.status === 401 && r.touched.length === 0)
  r = await send(request({}, 'sb_publishable_xxx'))
  check('진단 POST (공개 키를 토큰처럼): 401, 로그인 확인만 하고 끝나요', r.status === 401 && r.touched.join(',') === 'getUser')
  r = await send(new Request('http://x/register-bakery', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }))
  check('진단 단순 POST (헤더 없음): 401, 아무것도 호출하지 않아요', r.status === 401 && r.touched.length === 0)
}
{
  const r = await run(request(good), { hasBakery: async () => true })
  check('이미 등록된 빵집은 카카오를 다시 부르지 않고 성공', r.status === 200 && r.body.registered === false && r.calls.kakao === 0 && r.calls.upserts.length === 0)
}
{
  const r = await run(request(good), { searchKakao: async () => [{ ...docs[1], x: '126.978', y: '37.5665' }] })
  check('카카오가 알려준 좌표가 부산 밖이면 400, 등록하지 않아요', r.status === 400 && r.body.error.code === 'OUT_OF_AREA' && r.calls.upserts.length === 0)
}
{
  const r = await run(request(good), { searchKakao: async () => { throw new Error('down') } })
  check('카카오 장애는 502, 등록하지 않아요', r.status === 502 && r.calls.upserts.length === 0)
}
{
  const r = await run(request({ ...good, id: '99999999' }))
  check('카카오에 없는 빵집은 400, 등록하지 않아요', r.status === 400 && r.body.error.code === 'BAKERY_NOT_FOUND' && r.calls.upserts.length === 0)
}
{
  const r = await run(request({ ...good, name: '내가 지어낸 이름' }))
  const row = r.calls.upserts[0]
  check('등록 성공(200)', r.status === 200 && r.body.registered === true)
  check('이름 · 좌표 · 지역은 클라이언트 값(해운대 주장)이 아니라 카카오 좌표로 정해 저장', row.name === '진짜 베이커리' && row.lat === 35.1581 && row.lng === 129.0601 && row.address === '부산 서구 1' && row.district_id === 'seomyeon', JSON.stringify(row))
}

// ── 보안 점검: Verify JWT를 꺼도 안전한지 (이 함수가 스스로 막는지) ──
{
  // 인증이 안 된 요청은 인증 확인(getUser) 말고는 아무것도 건드리지 않아요
  const touched = []
  const spy = {
    getUser: async (jwt) => (touched.push('getUser'), jwt === 'good' ? { id: 'u1', emailConfirmed: true } : null),
    hasBakery: async () => (touched.push('hasBakery'), false),
    upsertBakery: async () => touched.push('upsert'),
    searchKakao: async () => (touched.push('kakao'), docs),
  }
  for (const token of [null, 'garbage', 'sb_publishable_xxxxxxxxxxxx', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.sig']) {
    const res = await handleRequest(request(good, token), spy)
    check(`인증 안 된 요청 차단(401): ${token ? token.slice(0, 14) : '토큰 없음'}`, res.status === 401)
  }
  check('인증이 안 된 요청은 DB · 카카오를 전혀 건드리지 않아요', touched.every((name) => name === 'getUser'), touched.join(','))
}
{
  const r = await run(request(good), {
    getUser: async () => {
      throw new Error('auth server down')
    },
  })
  check('인증 확인 서버가 죽어도 열어 주지 않아요(실패 시 차단 401)', r.status === 401 && r.calls.kakao === 0 && r.calls.upserts.length === 0)
}
{
  const failingUpsert = async () => {
    throw new Error('db exploded: secret-detail')
  }
  const r = await run(request(good), { upsertBakery: failingUpsert })
  const res = await handleRequest(request(good), makeDeps({ upsertBakery: failingUpsert }).deps)
  const text = await res.text()
  check('DB 오류는 500이고 내부 내용을 숨겨요', r.status === 500 && !text.includes('secret-detail') && !text.includes('exploded'))
  check('오류 응답에도 CORS 헤더가 있어 브라우저가 읽을 수 있어요', res.headers.get('Access-Control-Allow-Origin') === '*')
}
{
  const r = await run(request(good), {
    hasBakery: async () => {
      throw new Error('db down')
    },
  })
  check('빵집 조회 중 오류도 500(내용 숨김)', r.status === 500 && r.body.error.code === 'INTERNAL')
}
{
  const r = await run(request({ ...good, name: 'x'.repeat(5000) }))
  check('너무 큰 요청은 413, 카카오를 부르지 않아요', r.status === 413 && r.calls.kakao === 0)
}
{
  const r = await run(new Request('http://x', { method: 'POST', headers: { Authorization: 'Bearer good' }, body: '{not json' }))
  check('JSON이 아닌 본문은 400', r.status === 400)
}
{
  let asked = 0
  const r = await run(request(good), { allowLookup: () => ((asked += 1), false) })
  check('카카오 호출 한도를 넘으면 429, 호출하지 않아요', r.status === 429 && r.body.error.code === 'RATE_LIMITED' && r.calls.kakao === 0 && asked === 1)
}
{
  let asked = 0
  const r = await run(request(good), { hasBakery: async () => true, allowLookup: () => ((asked += 1), false) })
  check('이미 등록된 빵집은 호출 한도를 쓰지 않아요', r.status === 200 && asked === 0)
}
{
  let clock = 0
  const allow = createRateLimiter(3, 1000, () => clock)
  const results = [allow('a'), allow('a'), allow('a'), allow('a'), allow('b')]
  clock = 1500
  check('호출 제한기: 3번까지 허용, 4번째 거부, 다른 사용자는 별개', JSON.stringify(results) === '[true,true,true,false,true]')
  check('호출 제한기: 시간이 지나면 다시 허용', allow('a') === true)
}
{
  const res = await handleRequest(new Request('http://x', { method: 'OPTIONS' }), makeDeps().deps)
  check('브라우저 사전 확인(OPTIONS)은 인증 없이 통과', res.status === 200 && res.headers.get('Access-Control-Allow-Headers').includes('authorization'))
}
{
  // 응답에 비밀 값이 섞이지 않는지: 카카오 키를 가진 척하는 의존성으로 여러 응답을 모아 검사
  const SECRET = 'KAKAO-SECRET-KEY-123'
  const deps = makeDeps({
    searchKakao: async () => {
      throw new Error(`kakao failed with ${SECRET}`)
    },
  }).deps
  const bodies = []
  for (const req of [request(good, null), request(good, 'unverified'), request({ ...good, id: 'x' }), request(good), request({ ...good, id: '99999999' })]) {
    bodies.push(await (await handleRequest(req, deps)).text())
  }
  check('어떤 응답에도 비밀 값이 들어가지 않아요', bodies.every((text) => !text.includes(SECRET)))
}

// ── 서버 로그(실패 단계)와 DB 권한 오류 구분 ──
{
  const logs = []
  const logDeps = (over) => makeDeps({ ...over }).deps
  const withLog = (deps) => ({ ...deps, log: (step, detail) => logs.push({ step, detail }) })
  const send = async (deps, req = request(good)) => {
    logs.length = 0
    const res = await handleRequest(req, withLog(deps))
    const text = await res.text()
    return { status: res.status, text, body: JSON.parse(text), cors: res.headers.get('Access-Control-Allow-Origin'), logs: [...logs] }
  }

  // 실제로 겪은 오류: service_role에 bakeries 권한이 없을 때 (42501)
  const permissionError = Object.assign(new Error('permission denied for table bakeries'), { name: 'PostgrestError', code: '42501', hint: 'Grant the required privileges with: GRANT SELECT ON public.bakeries TO service_role;' })
  let r = await send(logDeps({ hasBakery: async () => { throw permissionError } }))
  check('DB 권한 오류(42501)는 500 DB_PERMISSION으로 구분하고, CORS가 붙어 브라우저가 읽을 수 있어요', r.status === 500 && r.body.error.code === 'DB_PERMISSION' && r.cors === '*')
  check('권한 오류 응답에는 표 이름 · 힌트 · 코드 같은 내부 내용이 없어요', !/bakeries|GRANT|service_role|42501|permission denied/i.test(r.text), r.text)
  check('서버 로그에는 실패 단계(lookup-bakery)와 오류 코드가 남아요', r.logs.length === 1 && r.logs[0].step === 'lookup-bakery' && r.logs[0].detail.includes('code=42501'), JSON.stringify(r.logs))
  check('서버 로그에 GRANT 힌트 전문이나 요청의 로그인 토큰은 없어요', !r.logs[0].detail.includes('GRANT') )

  // 등록(저장) 단계의 일반 오류
  r = await send(logDeps({ searchKakao: async () => docs, upsertBakery: async () => { throw new Error('upsert exploded') } }), request({ ...good, id: '12345678' }))
  check('저장 단계 오류는 500 INTERNAL(내용 숨김) + 서버 로그 단계=save-bakery', r.status === 500 && r.body.error.code === 'INTERNAL' && !r.text.includes('exploded') && r.logs[0]?.step === 'save-bakery' && r.logs[0].detail.includes('exploded'), JSON.stringify(r.logs))

  // 권한 오류가 저장 단계에서 나도 구분돼요 (insert 권한이 없을 때)
  r = await send(logDeps({ searchKakao: async () => docs, upsertBakery: async () => { throw Object.assign(new Error('permission denied for table bakeries'), { code: '42501' }) } }), request({ ...good, id: '12345678' }))
  check('저장 단계의 권한 오류도 DB_PERMISSION + 단계=save-bakery', r.body.error?.code === 'DB_PERMISSION' && r.logs[0]?.step === 'save-bakery')

  // 카카오 오류
  r = await send(logDeps({ searchKakao: async () => { throw new Error('kakao 401') } }))
  check('카카오 오류는 502, 서버 로그 단계=kakao', r.status === 502 && r.body.error.code === 'KAKAO_UNAVAILABLE' && r.logs[0]?.step === 'kakao' && r.logs[0].detail.includes('kakao 401'))

  // 정상 요청 · 검증 실패는 로그를 남기지 않아요 (로그가 시끄럽지 않게)
  r = await send(logDeps({ searchKakao: async () => docs }), request({ ...good, id: '12345678' }))
  check('정상 등록은 로그를 남기지 않아요', r.status === 200 && r.logs.length === 0)
  r = await send(logDeps(), request({ ...good, id: 'x' }))
  check('입력 오류(400) · 로그인 오류(401)도 오류 로그를 남기지 않아요', r.status === 400 && r.logs.length === 0)

  // 로그 함수가 고장나도 응답은 정상이에요
  const brokenLog = { ...logDeps({ hasBakery: async () => { throw new Error('boom') } }), log: () => { throw new Error('log failed') } }
  const res = await handleRequest(request(good), brokenLog)
  check('로그를 못 남겨도 500 응답은 그대로 나가요', res.status === 500 && (await res.json()).error.code === 'INTERNAL')
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
