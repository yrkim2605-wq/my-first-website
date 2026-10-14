// delete-account(회원 탈퇴 서버 함수)의 판단 로직 검증. Supabase는 가짜로 바꿔서 실제 서버를 부르지 않아요.
// 실행: node supabase/tests/delete-account.test.mjs   (Node의 TypeScript 지원으로 .ts를 그대로 불러와요)

import { MAX_FOLDER_DEPTH, MAX_PHOTO_FILES, PHOTO_PAGE_SIZE, REAUTH_WINDOW_SECONDS, collectPhotoPaths, deleteUserPhotos, handleRequest, lastAuthenticatedAt } from '../functions/delete-account/index.ts'

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

const UID = '11111111-1111-4111-8111-111111111111'
const NOW = 1_800_000_000
const makeJwt = (amr) => `h.${Buffer.from(JSON.stringify({ sub: UID, amr })).toString('base64url')}.s`
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
    getUser: async () => ({ id: UID }),
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
  check('정상: 사진 → 계정 → 마무리 청소 순서로 지우고 200', res.status === 200 && order === 'photos,user,photos', `${res.status} ${order}`)
  check('토큰의 주인(u1)만 지워요', calls.every(([name, id]) => name === 'log' || id === UID))
}
{
  // 요청에 다른 사람 id를 실어도 쓰지 않아요
  const { calls } = await run(freshJwt, {}, { confirm: true, userId: 'victim', id: 'victim', user_id: 'victim' })
  check('요청에 다른 사용자 id를 실어도 무시', calls.filter(([name]) => name !== 'log').every(([, id]) => id === UID))
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

// ═══ 보안 검토에서 추가한 점검 ═══

// ── 토큰 구조: 실제 토큰처럼 한글(닉네임)이 들어 있어도 인증 시각을 읽는지 ──
{
  const realistic = (extra = {}) => {
    const payload = JSON.stringify({ sub: UID, role: 'authenticated', user_metadata: { nickname: '빵덕후한글', terms_agreed_at: '2026-10-14T01:02:03Z' }, amr: [{ method: 'password', timestamp: NOW - 30 }], ...extra })
    return `eyJhbGciOiJFUzI1NiJ9.${Buffer.from(payload, 'utf8').toString('base64url')}.c2ln`
  }
  check('토큰 payload에 한글(닉네임)이 있어도 인증 시각을 읽어요', lastAuthenticatedAt(realistic()) === NOW - 30)
  const { res } = await run(realistic())
  check('실제 토큰과 같은 구조(한글 포함)로 정상 탈퇴가 돼요', res.status === 200)
  const stale = await run(realistic({ amr: [{ method: 'password', timestamp: NOW - 3600 }] }))
  check('1시간 전 로그인 토큰은 거절 (오래된 세션을 가로챈 경우)', stale.res.status === 403 && stale.json.error.code === 'REAUTH_REQUIRED')
  const noAmr = await run(realistic({ amr: undefined }))
  check('amr이 없는 토큰은 거절 (안전한 쪽으로 실패)', noAmr.res.status === 403)
  const future = await run(realistic({ amr: [{ method: 'password', timestamp: NOW + 5 }] }))
  check('시계가 몇 초 어긋나 "미래 시각"이어도 정상 처리', future.res.status === 200)
  const weird = await run(realistic({ amr: [{ method: 'password', timestamp: 'x' }, null, 'abc'] }))
  check('amr 안에 이상한 값이 섞여 있으면 거절하고 오류 없이 처리', weird.res.status === 403)
}

// ── 토큰 모양 검사: 인증 서버에 묻기 전에 걸러요 ──
{
  let asked = 0
  const spy = { getUser: async () => (asked += 1, { id: UID }) }
  for (const [label, jwt] of [['공개용 키(sb_publishable_…)', 'sb_publishable_abcDEF123'], ['점이 없는 문자열', 'abcdef'], ['점이 4개', 'a.b.c.d'], ['특수문자 포함', 'a b.c.d'], ['빈 토큰', '']]) {
    asked = 0
    const { res, calls } = await run(jwt || null, spy)
    check(`토큰 모양이 아니면 인증 서버를 부르지 않고 401: ${label}`, res.status === 401 && asked === 0 && calls.length === 0)
  }
}

// ── 대상 id가 비정상이면 아무것도 지우지 않아요 ──
for (const [label, id] of [['빈 값', ''], ['상위 경로', '../'], ['다른 사람 폴더를 노린 값', `${UID}/../other`], ['null', null]]) {
  const { res, calls } = await run(freshJwt, { getUser: async () => ({ id }) })
  check(`인증 서버가 이상한 id(${label})를 돌려줘도 아무것도 지우지 않아요`, res.status === 401 && calls.every(([name]) => name === 'log'))
}

// ── 사진 삭제: 하위 폴더 · 여러 쪽 · 일부만 성공 · 오류 ──
const makeBucket = (tree, over = {}) => {
  // tree: { 'uid': [{name, id|null}], 'uid/sub': [...] }  (폴더 항목은 id가 null)
  const removed = []
  const listed = []
  const bucket = {
    removed,
    listed,
    list: async (prefix, { limit, offset }) => {
      listed.push([prefix, offset])
      if (over.listError) return { data: null, error: over.listError }
      return { data: (tree[prefix] ?? []).slice(offset, offset + limit), error: null }
    },
    remove: async (paths) => {
      if (over.removeError) return { data: null, error: over.removeError }
      const done = over.partial ? paths.slice(0, paths.length - 1) : paths
      removed.push(...done)
      return { data: done.map((name) => ({ name })), error: null }
    },
  }
  return bucket
}
const file = (name) => ({ name, id: `id-${name}` })
const folder = (name) => ({ name, id: null })
{
  const bucket = makeBucket({ [UID]: [file('a.jpg'), file('b.jpg')] })
  await deleteUserPhotos(bucket, UID)
  check('내 폴더의 파일을 모두 지워요 (경로는 {내 id}/파일명)', JSON.stringify(bucket.removed) === JSON.stringify([`${UID}/a.jpg`, `${UID}/b.jpg`]))
}
{
  const bucket = makeBucket({ [UID]: [file('a.jpg'), folder('sub')], [`${UID}/sub`]: [file('deep.jpg'), folder('deeper')], [`${UID}/sub/deeper`]: [file('deepest.jpg')] })
  await deleteUserPhotos(bucket, UID)
  check('하위 폴더 안의 파일도 찾아서 지워요 (정책이 허용하는 중첩 경로)', bucket.removed.length === 3 && bucket.removed.includes(`${UID}/sub/deeper/deepest.jpg`), JSON.stringify(bucket.removed))
  check('폴더 자체를 파일처럼 지우려 하지 않아요', !bucket.removed.includes(`${UID}/sub`) && !bucket.removed.includes(`${UID}/sub/deeper`))
}
{
  const many = Array.from({ length: 250 }, (_, i) => file(`p${i}.jpg`))
  const bucket = makeBucket({ [UID]: many })
  await deleteUserPhotos(bucket, UID)
  check(`${PHOTO_PAGE_SIZE}개가 넘어도 다음 쪽까지 모두 지워요 (250장)`, bucket.removed.length === 250 && new Set(bucket.removed).size === 250)
  check('목록은 쪽(offset)을 넘기며 읽어요', bucket.listed.some(([, offset]) => offset === 200))
}
{
  const bucket = makeBucket({})
  await deleteUserPhotos(bucket, UID)
  check('사진이 없으면 지울 것 없이 끝나요', bucket.removed.length === 0)
}
{
  const outside = makeBucket({ [UID]: [file('mine.jpg')], 'other-user': [file('theirs.jpg')], '': [file('root.jpg')] })
  await deleteUserPhotos(outside, UID)
  check('다른 사람 폴더 · 버킷 맨 위의 파일은 건드리지 않아요', outside.removed.length === 1 && outside.listed.every(([prefix]) => prefix === UID || prefix.startsWith(`${UID}/`)))
}
for (const bad of ['', '../', 'not-a-uuid', `${UID}/x`, UID.toUpperCase().slice(1)]) {
  const bucket = makeBucket({ '': [file('root.jpg')] })
  let thrown = false
  try {
    await deleteUserPhotos(bucket, bad)
  } catch {
    thrown = true
  }
  check(`사용자 id가 UUID가 아니면(${JSON.stringify(bad)}) 목록도 삭제도 시도하지 않아요`, thrown && bucket.listed.length === 0 && bucket.removed.length === 0)
}
{
  const bucket = makeBucket({ [UID]: [file('a.jpg'), file('b.jpg'), file('c.jpg')] }, { partial: true })
  let message = ''
  try {
    await deleteUserPhotos(bucket, UID)
  } catch (error) {
    message = String(error.message)
  }
  check('오류 없이 일부만 지워지면 실패로 처리해요 (남은 파일을 성공으로 넘기지 않아요)', /partial photo removal/.test(message), message)
  const { res, calls } = await run(freshJwt, { deletePhotos: async () => deleteUserPhotos(makeBucket({ [UID]: [file('a.jpg'), file('b.jpg')] }, { partial: true }), UID) })
  check('일부만 지워진 경우 계정은 지우지 않고 500 PHOTO_CLEANUP_FAILED', res.status === 500 && !calls.some(([name]) => name === 'user'))
}
{
  let thrown = null
  try {
    await deleteUserPhotos(makeBucket({ [UID]: [file('a.jpg')] }, { listError: new Error('list failed') }), UID)
  } catch (error) {
    thrown = error
  }
  check('목록을 못 읽으면 실패 (지우지 않아요)', thrown?.message === 'list failed')
  let removeThrown = null
  try {
    await deleteUserPhotos(makeBucket({ [UID]: [file('a.jpg')] }, { removeError: new Error('denied') }), UID)
  } catch (error) {
    removeThrown = error
  }
  check('삭제 오류가 나면 그대로 실패', removeThrown?.message === 'denied')
}
{
  const endless = {}
  endless[UID] = Array.from({ length: MAX_PHOTO_FILES + 1 }, (_, i) => file(`p${i}.jpg`))
  let message = ''
  try {
    await collectPhotoPaths(makeBucket(endless), UID)
  } catch (error) {
    message = error.message
  }
  check(`파일이 ${MAX_PHOTO_FILES}개를 넘으면 멈춰요 (과도한 작업 방지)`, /too many/.test(message))
  const deep = {}
  let prefix = UID
  for (let i = 0; i <= MAX_FOLDER_DEPTH + 1; i += 1) {
    deep[prefix] = [folder('d')]
    prefix = `${prefix}/d`
  }
  let deepMessage = ''
  try {
    await collectPhotoPaths(makeBucket(deep), UID)
  } catch (error) {
    deepMessage = error.message
  }
  check(`폴더가 ${MAX_FOLDER_DEPTH}단계보다 깊으면 멈춰요 (끝없는 폴더 방지)`, /too deep/.test(deepMessage))
}

// ── 마무리 청소 (사진 삭제 ~ 계정 삭제 사이에 올라온 사진) ──
{
  const order = []
  const { res } = await run(freshJwt, { deletePhotos: async () => order.push('photos'), deleteUser: async () => order.push('user') })
  check('순서: 사진 삭제 → 계정 삭제 → 마무리 청소', res.status === 200 && order.join() === 'photos,user,photos')
}
{
  let photoCalls = 0
  const { res, json, calls } = await run(freshJwt, { deletePhotos: async () => { photoCalls += 1; if (photoCalls === 2) throw new Error('late failure') } })
  check('마무리 청소가 실패해도 계정은 이미 지워졌으니 탈퇴는 성공(200)', res.status === 200 && json.ok === true)
  check('마무리 청소 실패는 서버 로그에 남아요 (응답에는 없어요)', calls.some(([name, step]) => name === 'log' && step === 'sweep-photos') && !JSON.stringify(json).includes('late failure'))
}
{
  const { calls } = await run(freshJwt, { deleteUser: async () => { throw new Error('db down') } })
  check('계정 삭제가 실패하면 마무리 청소는 하지 않아요', calls.filter(([name]) => name === 'photos').length === 1)
}
{
  // 서로 다른 두 사용자가 동시에 요청해도 각자 자기 것만 (대상은 항상 토큰 주인)
  const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const seen = []
  const make = (id) => ({ getUser: async () => ({ id }), deletePhotos: async (target) => seen.push(['photos', target]), deleteUser: async (target) => seen.push(['user', target]) })
  const [first, second] = await Promise.all([run(freshJwt, make(A), { confirm: true, id: B }), run(freshJwt, make(B), { confirm: true, id: A })])
  check('동시에 두 사용자가 요청해도 각자 자기 계정만 지워요', first.res.status === 200 && second.res.status === 200 && seen.filter(([, id]) => id === A).length === 3 && seen.filter(([, id]) => id === B).length === 3)
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
