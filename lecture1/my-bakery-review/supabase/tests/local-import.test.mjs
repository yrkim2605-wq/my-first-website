// 로컬 기록 → 계정 이전 로직 검증 (src/migration/localImport.js).
// 진짜 서버 대신 가짜 서버(빵집당 일지 1개 규칙 · 하루 한도)를 써요.   실행: node supabase/tests/local-import.test.mjs

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const lib = await server.ssrLoadModule('/src/migration/localImport.js')
const { readLocalSnapshot, loadImportState, recordImportState, classifyPhoto, buildImportPlan, toImportItems, simulateImportExp, runImport, summarizeResults, importStateKey, PHOTO_MAX_BYTES } = lib

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}

// 쓰기를 기록하는 가짜 localStorage
const makeStorage = (initial = {}) => {
  const data = { ...initial }
  const log = { sets: [], removes: [], gets: [] }
  return {
    log,
    data,
    getItem: (key) => (log.gets.push(key), key in data ? data[key] : null),
    setItem: (key, value) => (log.sets.push(key), (data[key] = String(value))),
    removeItem: (key) => (log.removes.push(key), delete data[key]),
  }
}

const ENOUGH = '맛있어요 소금빵이 정말 훌륭해서 또 가고 싶어요 강력 추천합니다'
const jpegDataUrl = (bytes) => `data:image/jpeg;base64,${Buffer.alloc(bytes, 1).toString('base64')}`
const review = (id, bakeryId, over = {}) => ({
  id, userId: 'local-u1', authorNickname: '임시닉', bakeryId: String(bakeryId), bakerySource: 'kakao', bakeryName: `빵집${bakeryId}`, districtId: 'seomyeon',
  rating: 4.5, content: ENOUGH, photo: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...over,
})
const info = (id, over = {}) => [String(id), { id: String(id), name: `빵집${id}`, districtId: 'seomyeon', address: '부산', lat: 35.1, lng: 129.0, ...over }]

const REVIEWS_KEY = 'my-bakery-review:v1:reviews'
const PROFILES_KEY = 'my-bakery-review:v1:profiles'
const VISITED_KEY = 'my-bakery-review:visited-real-bakery-ids'

// ── 1. 이 브라우저 기록 읽기: 읽기 전용 ──
{
  const storage = makeStorage({
    [PROFILES_KEY]: JSON.stringify({ version: 1, currentUserId: 'local-u1', profiles: [{ userId: 'local-u1', nickname: '임시닉', createdAt: '2026-01-01' }] }),
    [REVIEWS_KEY]: JSON.stringify({ version: 1, reviews: [review('r1', 1001), review('r2', 1002)] }),
    [VISITED_KEY]: JSON.stringify(['1001', 1003]),
  })
  const snapshot = readLocalSnapshot(storage)
  check('읽기: 프로필 · 일지 · 방문 체크를 읽어요 (방문 ID는 문자열로)', snapshot.profiles.length === 1 && snapshot.reviews.length === 2 && JSON.stringify(snapshot.visitedIds) === '["1001","1003"]')
  check('읽기 전용: 쓰기 · 삭제가 한 번도 없어요', storage.log.sets.length === 0 && storage.log.removes.length === 0)
  const corrupt = makeStorage({ [REVIEWS_KEY]: '{깨진 값', [VISITED_KEY]: 'not-json' })
  const empty = readLocalSnapshot(corrupt)
  check('값이 깨져 있어도 오류 없이 빈 목록 + 백업하려고 쓰지도 않아요', empty.reviews.length === 0 && empty.visitedIds.length === 0 && corrupt.log.sets.length === 0)
  check('저장 공간이 없는 환경도 안전', readLocalSnapshot(null).reviews.length === 0)
}

// ── 2. 사진 점검 (서버 저장소 정책: JPEG/WebP, 1MB) ──
{
  check('사진 없음', classifyPhoto(null).hasPhoto === false)
  check('JPEG 100KB는 가능', classifyPhoto(jpegDataUrl(100 * 1024)).ok === true)
  check('정확히 1MB는 가능', classifyPhoto(jpegDataUrl(PHOTO_MAX_BYTES)).ok === true)
  const big = classifyPhoto(jpegDataUrl(PHOTO_MAX_BYTES + 3000))
  check('1MB 초과는 불가 + 크기 설명', big.ok === false && big.reason.includes('1MB') && big.reason.includes('글만 가져와요'), big.reason)
  const png = classifyPhoto(`data:image/png;base64,${Buffer.alloc(100).toString('base64')}`)
  check('PNG는 불가 + 형식 설명', png.ok === false && png.reason.includes('image/png') && png.reason.includes('JPEG'), png.reason)
  check('WebP는 가능', classifyPhoto(`data:image/webp;base64,${Buffer.alloc(100, 1).toString('base64')}`).ok === true)
  check('data URL이 아니면 불가(글만 이전)', classifyPhoto('https://x/y.jpg').ok === false && classifyPhoto('https://x/y.jpg').hasPhoto === true)
}

// ── 3. 미리보기 계획 ──
const emptyAccount = () => ({ reviewBakeryIds: new Set(), visitBakeryIds: new Set() })
const stateOf = (items = {}) => ({ version: 1, accountUserId: 'acc-A', items })
{
  const snapshot = {
    profiles: [{ userId: 'local-u1', nickname: '임시닉' }],
    reviews: [
      review('ok', 1001, { photo: jpegDataUrl(2000) }),
      review('sample', 5, { bakerySource: 'sample' }),
      review('existing', 1002),
      review('nobakery', 1003),
      review('short', 1004, { content: '짧은 일지' }),
      review('done', 1005),
      review('dupA', 1006),
      review('dupB', 1006, { content: ENOUGH + ' 두번째' }),
      review('bigphoto', 1007, { photo: jpegDataUrl(PHOTO_MAX_BYTES + 5000) }),
    ],
    visitedIds: ['1001', '1002', '1003', '7', '1008'],
  }
  const bakeryInfoById = new Map([info(1001), info(1002), info(1004), info(1005), info(1006), info(1007), info(1008)])
  const plan = buildImportPlan({
    snapshot,
    account: { reviewBakeryIds: new Set(['1002']), visitBakeryIds: new Set(['1002']) },
    registeredIds: new Set(),
    bakeryInfoById,
    state: stateOf({ 'review:done': { status: 'done' } }),
  })
  const status = Object.fromEntries(plan.reviews.map((r) => [r.localId, r.status]))
  check('일지 분류: 이전 가능 / 예시 / 계정에 이미 있음 / 빵집 정보 없음 / 너무 짧음 / 이미 이전 / 중복 / 큰 사진', JSON.stringify(status) === JSON.stringify({ ok: 'importable', sample: 'sample', existing: 'existing', nobakery: 'no_bakery_info', short: 'too_short', done: 'done', dupA: 'importable', dupB: 'duplicate', bigphoto: 'importable' }), JSON.stringify(status))
  check('이유 문구가 항목마다 있어요 (예시 · 기존 · 정보 없음 · 짧음)', plan.reviews.filter((r) => ['sample', 'existing', 'no_bakery_info', 'too_short', 'duplicate', 'done'].includes(r.status)).every((r) => r.reason && r.reason.length > 5))
  check('예시 빵집 이유가 명확해요', plan.reviews.find((r) => r.localId === 'sample').reason.includes('예시 빵집'))
  check('너무 짧은 일지는 공백 뺀 글자 수와 20자 안내', plan.reviews.find((r) => r.localId === 'short').reason.includes('20자'))
  check('큰 사진 일지도 글은 이전 가능하고 사진만 제외된다고 안내', plan.reviews.find((r) => r.localId === 'bigphoto').photo.ok === false && plan.reviews.find((r) => r.localId === 'bigphoto').photo.reason.includes('글만'))
  const vs = Object.fromEntries(plan.visits.map((v) => [v.bakeryId, v.status]))
  check('방문 체크 분류: 이전 가능 / 이미 체크 / 정보 없음 / 예시', JSON.stringify(vs) === JSON.stringify({ 1001: 'importable', 1002: 'existing', 1003: 'no_bakery_info', 7: 'sample', 1008: 'importable' }), JSON.stringify(vs))

  // 20자 미만 일지를 이전 전에 고쳐 쓰면 이전 가능
  const edited = buildImportPlan({ snapshot, account: emptyAccount(), registeredIds: new Set(), bakeryInfoById, state: stateOf(), edits: { short: ENOUGH + ' 고쳐 썼어요' } })
  check('짧은 일지를 20자 이상으로 고치면 이전 가능', edited.reviews.find((r) => r.localId === 'short').status === 'importable')
  const stillShort = buildImportPlan({ snapshot, account: emptyAccount(), registeredIds: new Set(), bakeryInfoById, state: stateOf(), edits: { short: '아직 짧아요' } })
  check('고쳐도 20자 미만이면 계속 이전 불가 (건너뛰기)', stillShort.reviews.find((r) => r.localId === 'short').status === 'too_short')
  const registered = buildImportPlan({ snapshot, account: emptyAccount(), registeredIds: new Set(['1003']), bakeryInfoById, state: stateOf() })
  check('서버에 이미 등록된 빵집은 위치 정보가 없어도 이전 가능', registered.reviews.find((r) => r.localId === 'nobakery').status === 'importable')

  // 계정별 이전 상태 (다른 계정에는 적용되지 않아요)
  const storage = makeStorage()
  recordImportState('acc-A', 'review:ok', 'done', storage)
  check('이전 상태는 계정 ID가 들어간 키에 저장돼요', Object.keys(storage.data).length === 1 && Object.keys(storage.data)[0] === importStateKey('acc-A'))
  const stateA = loadImportState('acc-A', storage)
  const stateB = loadImportState('acc-B', storage)
  const planA = buildImportPlan({ snapshot, account: emptyAccount(), registeredIds: new Set(), bakeryInfoById, state: stateA })
  const planB = buildImportPlan({ snapshot, account: emptyAccount(), registeredIds: new Set(), bakeryInfoById, state: stateB })
  check('계정 A에서 이전한 일지는 A에서는 "이미 이전", 계정 B에서는 다시 이전 가능', planA.reviews.find((r) => r.localId === 'ok').status === 'done' && planB.reviews.find((r) => r.localId === 'ok').status === 'importable')
  const forged = makeStorage({ [importStateKey('acc-B')]: JSON.stringify({ version: 1, accountUserId: 'acc-A', items: { 'review:ok': { status: 'done' } } }) })
  check('다른 계정 ID가 들어 있는 상태 파일은 무시해요', Object.keys(loadImportState('acc-B', forged).items).length === 0)

  // 서버에 보낼 입력
  const items = toImportItems(plan, plan.reviews.concat(plan.visits).map((x) => x.key), bakeryInfoById)
  const reviewItems = items.filter((i) => i.kind === 'review')
  check('서버로 보내는 항목은 "이전 가능"한 것만 (예시 · 기존 · 중복 · 짧음 · 정보 없음 제외)', reviewItems.map((i) => i.key).sort().join(',') === 'review:bigphoto,review:dupA,review:ok')
  const okItem = reviewItems.find((i) => i.key === 'review:ok')
  check('입력에 빵집 위치 · 지역 · 사진이 들어가고 EXP · 날짜 · 작성자는 없어요', okItem.input.bakeryLat === 35.1 && okItem.input.bakeryLng === 129.0 && okItem.input.photo.startsWith('data:image/jpeg') && !('createdAt' in okItem.input) && !('expReview' in okItem.input) && !('userId' in okItem.input))
  const bigItem = reviewItems.find((i) => i.key === 'review:bigphoto')
  check('큰 사진은 보내지 않고(글만) 안내문을 달아요', bigItem.input.photo === null && bigItem.photoNote.includes('1MB'))
  check('선택하지 않은 항목은 제외돼요', toImportItems(plan, ['review:ok'], bakeryInfoById).length === 1)
  check('방문 체크 항목도 이전 가능한 것만', items.filter((i) => i.kind === 'visit').map((i) => i.input.id).sort().join(',') === '1001,1008')
}

// ── 4. EXP · 하루 한도 미리 계산 ──
{
  const make = (n) => Array.from({ length: n }, (_, i) => ({ key: `review:${i}`, kind: 'review', input: { bakeryId: String(2000 + i), districtId: ['haeundae', 'seomyeon', 'nampodong', 'gwangalli', 'dongnae'][i % 5], photo: null } }))
  const settings = { dailyExpCap: 100, reviewExp: 30, photoExp: 10 }
  const now = new Date('2026-10-14T03:00:00Z')
  const five = simulateImportExp({ accountReviews: [], items: make(5), settings, now })
  check('5개: 모두 오늘 저장 가능, 하루 EXP 한도로 앞 3개만 EXP 대상 (나머지 2개는 EXP 없음)', five.savableToday === 5 && five.expTargets === 3 && five.noExp === 2 && five.deferred === 0, JSON.stringify(five))
  check('예상 EXP = 일지 90 + 퀘스트 100 = 190 (서버 규칙과 같은 계산)', five.expGain === 190, String(five.expGain))
  const many = simulateImportExp({ accountReviews: [], items: make(22), settings, now })
  check('22개: 하루 20개까지만 오늘 저장하고 2개는 내일로', many.savableToday === 20 && many.deferred === 2, JSON.stringify(many))
  const used = simulateImportExp({
    accountReviews: [{ id: 'a', bakeryId: '1', bakerySource: 'kakao', districtId: 'seomyeon', expReview: true, expPhoto: false, createdAt: now.toISOString() }, { id: 'b', bakeryId: '2', bakerySource: 'kakao', districtId: 'seomyeon', expReview: true, expPhoto: false, createdAt: now.toISOString() }, { id: 'c', bakeryId: '3', bakerySource: 'kakao', districtId: 'seomyeon', expReview: true, expPhoto: false, createdAt: now.toISOString() }],
    items: make(2),
    settings,
    now,
  })
  check('오늘 이미 EXP 한도를 채웠다면 이전분은 EXP 없이 저장 (서버 규칙 유지)', used.expTargets === 0 && used.noExp === 2 && used.expGain === 0, JSON.stringify(used))
}

// ── 5. 실행: 가짜 서버 (빵집당 일지 1개, 하루 20개) ──
const makeServerFake = (opts = {}) => {
  const saved = new Map() // bakeryId -> 입력
  const visits = new Set()
  const calls = { create: [], visit: [] }
  const deps = (storage, accountId) => ({
    createReview: async (input) => {
      calls.create.push(input)
      if (opts.networkAfter != null && calls.create.length > opts.networkAfter) throw Object.assign(new Error('서버에 연결하지 못했어요.'), { code: 'NETWORK' })
      if (opts.dailyLimit != null && saved.size >= opts.dailyLimit) throw Object.assign(new Error('오늘은 일지를 너무 많이 썼어요'), { code: 'DAILY_REVIEW_LIMIT' })
      if (opts.rejectBakery === input.bakeryId) throw Object.assign(new Error('이 빵집은 확인하지 못했어요.'), { code: 'BAKERY_REJECTED' })
      if (opts.photoFailsFor === input.bakeryId && input.photo) throw Object.assign(new Error('사진을 올리지 못했어요.'), { code: 'PHOTO_FAILED' })
      if (saved.has(input.bakeryId)) throw Object.assign(new Error('이미 이 빵집에 기록을 남겼어요.'), { code: 'DUPLICATE_REVIEW' })
      saved.set(input.bakeryId, input)
      return { id: `srv-${input.bakeryId}`, expReview: saved.size <= 3, expPhoto: false }
    },
    addVisit: async (input) => {
      calls.visit.push(input)
      visits.add(input.id)
    },
    saveState: (key, status) => recordImportState(accountId, key, status, storage),
  })
  return { saved, visits, calls, deps }
}
const reviewItems = (ids) => ids.map((id) => ({ key: `review:r${id}`, kind: 'review', label: `빵집${id}`, input: { bakeryId: String(id), bakerySource: 'kakao', bakeryName: `빵집${id}`, rating: 5, content: ENOUGH, photo: null } }))

{
  const storage = makeStorage({ [REVIEWS_KEY]: JSON.stringify({ version: 1, reviews: [review('r1', 1)] }) })
  const fake = makeServerFake()
  let threw = null
  try {
    await runImport({ items: reviewItems([1, 2]), confirmed: false, deps: fake.deps(storage, 'acc-A') })
  } catch (error) {
    threw = error
  }
  check('최종 확인(confirmed) 없이는 실행 거부 + 서버 호출 0번 + 상태 기록 0번', threw !== null && fake.calls.create.length === 0 && storage.log.sets.length === 0)
  const t2 = await runImport({ items: reviewItems([1]), confirmed: 'yes', deps: fake.deps(storage, 'acc-A') }).catch((e) => e)
  check('confirmed가 정확히 true일 때만 실행해요 ("yes" 같은 값은 거부)', t2 instanceof Error && fake.calls.create.length === 0)
}
{
  // 성공 경로 + 로컬 기록 불변 + 상태 기록
  const original = JSON.stringify({ version: 1, reviews: [review('r1', 1), review('r2', 2), review('r3', 3)] })
  const storage = makeStorage({ [REVIEWS_KEY]: original, [VISITED_KEY]: JSON.stringify(['1', '2']) })
  const fake = makeServerFake()
  const progress = []
  const items = [...reviewItems([1, 2, 3]), { key: 'visit:1', kind: 'visit', label: '빵집1', input: { id: '1', name: '빵집1', lat: 1, lng: 2 } }]
  const out = await runImport({ items, confirmed: true, deps: fake.deps(storage, 'acc-A'), onProgress: (p) => progress.push(p.index) })
  const summary = summarizeResults(out.results)
  check('3개 일지 + 방문 체크 1개 모두 성공', summary.success === 4 && out.stopped === null && fake.saved.size === 3 && fake.visits.size === 1, JSON.stringify(summary))
  check('진행 상황이 항목마다 알려져요 (0,1,2,3)', JSON.stringify(progress) === '[0,1,2,3]')
  check('이 브라우저의 일지 · 방문 체크 기록은 그대로예요 (삭제 · 변경 없음)', storage.data[REVIEWS_KEY] === original && storage.data[VISITED_KEY] === JSON.stringify(['1', '2']) && storage.log.removes.length === 0)
  check('쓴 것은 계정별 이전 상태 키 하나뿐이에요', storage.log.sets.every((key) => key === importStateKey('acc-A')) && storage.log.sets.length === 4)
  const state = loadImportState('acc-A', storage)
  check('성공한 항목마다 이전 상태(done)가 남아요', ['review:r1', 'review:r2', 'review:r3', 'visit:1'].every((k) => state.items[k]?.status === 'done'))
  check('서버로 가는 입력에 날짜 · EXP가 없어요 (서버가 정해요)', fake.calls.create.every((c) => !('createdAt' in c) && !('expReview' in c)))
  // 같은 항목을 다시 실행해도 (상태가 사라졌다고 가정) 서버가 중복을 걸러서 EXP 중복 지급이 없어요
  const storage2 = makeStorage()
  const rerun = await runImport({ items: reviewItems([1, 2, 3]), confirmed: true, deps: fake.deps(storage2, 'acc-A') })
  const rerunSummary = summarizeResults(rerun.results)
  check('같은 일지를 다시 실행해도 중복 저장 없음 (서버가 "이미 있음"으로 거름)', rerunSummary.existing === 3 && rerunSummary.success === 0 && fake.saved.size === 3, JSON.stringify(rerunSummary))
  check('"이미 있음"도 이전 상태로 남겨서 다음에는 시도하지 않아요', loadImportState('acc-A', storage2).items['review:r1'].status === 'existing')
}
{
  // 중간에 한도 · 연결 오류로 멈춤 → 성공/실패 구분 → 이어서 재시도
  const storage = makeStorage()
  const fake = makeServerFake({ dailyLimit: 2 })
  const items = reviewItems([1, 2, 3, 4])
  const first = await runImport({ items, confirmed: true, deps: fake.deps(storage, 'acc-A') })
  const s1 = summarizeResults(first.results)
  check('하루 한도에서 멈춤: 성공 2 · 시도 못 함 2, 멈춘 이유 안내', s1.success === 2 && s1.notAttempted === 2 && first.stopped.reason === 'daily_limit' && first.stopped.message.includes('내일'), JSON.stringify([s1, first.stopped]))
  check('멈추기 전에 성공한 것만 상태가 남아요', Object.keys(loadImportState('acc-A', storage).items).sort().join(',') === 'review:r1,review:r2')
  // 다음 날: 상태를 반영한 계획으로 남은 것만
  const remaining = items.filter((i) => !loadImportState('acc-A', storage).items[i.key])
  fake.saved.delete('x')
  const fake2 = makeServerFake()
  fake2.saved.set('1', {})
  fake2.saved.set('2', {})
  const second = await runImport({ items: remaining, confirmed: true, deps: fake2.deps(storage, 'acc-A') })
  check('이어서 하기: 남은 2개만 시도하고 성공', summarizeResults(second.results).success === 2 && fake2.calls.create.map((c) => c.bakeryId).join(',') === '3,4' && second.stopped === null)

  const storageN = makeStorage()
  const fakeN = makeServerFake({ networkAfter: 1 })
  const net = await runImport({ items: reviewItems([1, 2, 3]), confirmed: true, deps: fakeN.deps(storageN, 'acc-A') })
  const sn = summarizeResults(net.results)
  check('연결 오류: 앞 1개 성공 · 오류난 1개 실패 표시 · 나머지 시도 안 함, 멈춘 이유가 오류 문구', sn.success === 1 && sn.failed === 1 && sn.notAttempted === 1 && net.stopped.reason === 'error' && net.stopped.code === 'NETWORK', JSON.stringify([sn, net.stopped]))
  check('연결 오류 뒤에는 더 이상 서버를 두드리지 않아요', fakeN.calls.create.length === 2)
  check('실패한 항목은 이전 상태에 남기지 않아요 (다음에 다시 시도)', !loadImportState('acc-A', storageN).items['review:r2'] && loadImportState('acc-A', storageN).items['review:r1'].status === 'done')

  const storageR = makeStorage()
  const fakeR = makeServerFake({ rejectBakery: '2' })
  const rej = await runImport({ items: reviewItems([1, 2, 3]), confirmed: true, deps: fakeR.deps(storageR, 'acc-A') })
  const sr = summarizeResults(rej.results)
  check('빵집 하나가 거절되면 그 항목만 실패하고 나머지는 계속 진행', sr.success === 2 && sr.failed === 1 && rej.stopped === null && rej.results[1].message.includes('확인하지 못했어요'), JSON.stringify(sr))

  const storageU = makeStorage()
  const fakeU = makeServerFake()
  let calls = 0
  const stopped = await runImport({ items: reviewItems([1, 2, 3]), confirmed: true, deps: fakeU.deps(storageU, 'acc-A'), shouldStop: () => (calls += 1) > 1 })
  check('사용자가 멈추면 지금 항목까지 끝내고 멈춰요 (나머지는 시도 안 함)', summarizeResults(stopped.results).success === 1 && stopped.stopped.reason === 'user' && summarizeResults(stopped.results).notAttempted === 2)
}
{
  // 사진 때문에 글이 유실되지 않아요
  const storage = makeStorage()
  const fake = makeServerFake({ photoFailsFor: '1' })
  const photoItem = { ...reviewItems([1])[0], input: { ...reviewItems([1])[0].input, photo: jpegDataUrl(1000) } }
  const out = await runImport({ items: [photoItem], confirmed: true, deps: fake.deps(storage, 'acc-A') })
  check('사진 업로드가 실패해도 글은 사진 없이 저장해요', out.results[0].status === 'success_no_photo' && fake.saved.get('1').photo === null && fake.saved.get('1').content === ENOUGH, JSON.stringify(out.results[0]))
  check('사진 없이 저장한 사실을 알려줘요', out.results[0].message.includes('글만'))
  check('사진 재시도는 정확히 1번 (같은 글을 두 번 저장하지 않아요)', fake.calls.create.length === 2 && fake.saved.size === 1)
  const big = { ...reviewItems([2])[0], photoNote: '사진이 1.5MB라서 서버 저장소 제한(1MB)을 넘어 글만 가져와요' }
  const out2 = await runImport({ items: [big], confirmed: true, deps: fake.deps(makeStorage(), 'acc-A') })
  check('큰 사진은 처음부터 제외하고 글만 저장 + 이유 표시', out2.results[0].status === 'success_no_photo' && out2.results[0].message.includes('1MB'))
}
{
  // 기존 계정 기록을 덮어쓰지 않아요
  const storage = makeStorage()
  const fake = makeServerFake()
  fake.saved.set('1', { content: '계정에 이미 있는 원래 내용' })
  const out = await runImport({ items: reviewItems([1]), confirmed: true, deps: fake.deps(storage, 'acc-A') })
  check('계정에 이미 있는 일지는 덮어쓰지 않고 건너뛰어요', out.results[0].status === 'existing' && fake.saved.get('1').content === '계정에 이미 있는 원래 내용')
  check('실행기는 수정 · 삭제 함수를 받지도 쓰지도 않아요', Object.keys(fake.deps(storage, 'acc-A')).sort().join(',') === 'addVisit,createReview,saveState')
}

console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
await server.close()
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
