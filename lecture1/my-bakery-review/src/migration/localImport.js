import { REVIEWS_STORAGE_KEY } from '../storage/reviewRepository'
import { PROFILES_STORAGE_KEY } from '../storage/profileRepository'
import { buildGameState, diffGameState, predictNewReviewExp } from '../utils/gameState'
import { getReviewContentStatus } from '../utils/reviewContent'

// 이 브라우저(localStorage)에 남아 있던 기록을 내 계정으로 옮기는 로직이에요. 화면과 분리된 순수 로직이라 테스트로 안전 규칙을 고정해요.
//
// 안전 규칙 (모두 테스트가 확인해요)
//  1) 최종 확인(confirmed)을 받기 전에는 서버에 아무것도 저장하지 않아요. 미리보기는 읽기만 해요.
//  2) 이 브라우저의 기록은 읽기만 하고, 지우거나 바꾸지 않아요. (성공해도 그대로 남아요)
//  3) 이미 계정에 있는 일지 · 방문 체크는 덮어쓰지 않고 건너뛰어요. 서버의 "빵집당 일지 1개" 규칙이 중복 · EXP 중복 지급을 막아요.
//  4) 하나씩 저장하고, 성공할 때마다 계정별 "이전 상태"를 바로 남겨요 → 중간에 멈춰도 남은 기록부터 안전하게 이어서 할 수 있어요.
//  5) 사진을 올리지 못해도 글(텍스트)은 사진 없이 저장해요.
//  6) 작성 날짜는 서버가 저장 시각으로 정해요(원래 날짜는 옮겨지지 않아요). EXP · 하루 한도도 서버 규칙 그대로예요.

export const VISITED_STORAGE_KEY = 'my-bakery-review:visited-real-bakery-ids' // VisitedBakeriesContext가 쓰는 키와 같아요
export const IMPORT_STATE_KEY_PREFIX = 'my-bakery-review:v1:import-state:'
export const importStateKey = (accountUserId) => `${IMPORT_STATE_KEY_PREFIX}${accountUserId}`

export const PHOTO_MAX_BYTES = 1048576 // 서버 사진 저장소(photos 버킷)의 1MB 제한 (0003_storage.sql)
const PHOTO_ALLOWED_TYPES = ['image/jpeg', 'image/webp']

const isDigits = (text) => {
  const value = String(text ?? '')
  return value.length >= 3 && value.length <= 20 && Array.from(value).every((char) => char >= '0' && char <= '9')
}

// ── 이 브라우저 기록 읽기 (읽기 전용: 깨진 값을 백업하려고 쓰는 일도 하지 않아요) ──
const readRaw = (storage, key) => {
  try {
    const raw = storage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export const readLocalSnapshot = (storage = globalThis.localStorage) => {
  if (!storage) return { profiles: [], reviews: [], visitedIds: [] }
  const profilesState = readRaw(storage, PROFILES_STORAGE_KEY)
  const reviewsState = readRaw(storage, REVIEWS_STORAGE_KEY)
  const visited = readRaw(storage, VISITED_STORAGE_KEY)
  return {
    profiles: Array.isArray(profilesState?.profiles) ? profilesState.profiles : [],
    reviews: Array.isArray(reviewsState?.reviews) ? reviewsState.reviews : [],
    visitedIds: Array.isArray(visited) ? visited.map((id) => String(id)) : [],
  }
}

// ── 계정별 이전 상태 ──
// { version: 1, accountUserId, items: { 'review:<로컬 일지 ID>': { status: 'done' | 'existing', at }, 'visit:<빵집 ID>': {...} } }
// done = 이 계정에 저장했어요 / existing = 이미 계정에 있어서 아무것도 쓰지 않았어요. 실패한 기록은 남기지 않아요(다음에 다시 시도해요).
export const loadImportState = (accountUserId, storage = globalThis.localStorage) => {
  const empty = { version: 1, accountUserId, items: {} }
  if (!storage || !accountUserId) return empty
  const state = readRaw(storage, importStateKey(accountUserId))
  if (!state || typeof state.items !== 'object' || state.items === null || state.accountUserId !== accountUserId) return empty
  return state
}

export const recordImportState = (accountUserId, key, status, storage = globalThis.localStorage) => {
  if (!storage || !accountUserId) return
  try {
    const state = loadImportState(accountUserId, storage)
    state.items[key] = { status, at: new Date().toISOString() }
    storage.setItem(importStateKey(accountUserId), JSON.stringify(state))
  } catch {
    // 저장 공간이 부족해서 이전 상태를 못 남겨도 괜찮아요: 다시 시도하면 서버가 "이미 있어요"로 걸러 줘요 (중복 저장 · EXP 중복 없음)
  }
}

// ── 사진 점검 (서버 저장소 정책: JPEG/WebP, 1MB 이하) ──
export const classifyPhoto = (photo) => {
  if (!photo) return { hasPhoto: false, ok: false, reason: null, bytes: 0 }
  if (typeof photo !== 'string' || !photo.startsWith('data:')) {
    return { hasPhoto: true, ok: false, reason: '사진을 읽을 수 없어서 글만 가져와요', bytes: 0 }
  }
  const comma = photo.indexOf(',')
  const header = comma < 0 ? '' : photo.slice(5, comma)
  const mime = header.split(';')[0]
  const payload = comma < 0 ? '' : photo.slice(comma + 1)
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  const bytes = Math.max(Math.floor((payload.length * 3) / 4) - padding, 0)
  if (!header.includes(';base64') || !payload) return { hasPhoto: true, ok: false, reason: '사진 형식을 읽을 수 없어서 글만 가져와요', bytes }
  if (!PHOTO_ALLOWED_TYPES.includes(mime)) return { hasPhoto: true, ok: false, reason: `사진 형식(${mime || '알 수 없음'})을 서버 저장소가 받지 않아서 글만 가져와요 (JPEG · WebP만 가능)`, bytes }
  if (bytes > PHOTO_MAX_BYTES) {
    return { hasPhoto: true, ok: false, reason: `사진이 ${(bytes / 1048576).toFixed(1)}MB라서 서버 저장소 제한(1MB)을 넘어 글만 가져와요`, bytes }
  }
  return { hasPhoto: true, ok: true, reason: null, bytes }
}

// ── 미리보기 계획 ──
// 입력
//   snapshot       : readLocalSnapshot() 결과
//   account        : { reviewBakeryIds: Set (이미 내 계정에 일지가 있는 빵집), visitBakeryIds: Set (이미 체크한 빵집) }
//   registeredIds  : Set — 서버 bakeries 표에 이미 있는 빵집 ID (없는 빵집은 위치 정보가 있어야 서버 함수가 등록할 수 있어요)
//   bakeryInfoById : Map — 지금 지도 목록의 빵집 정보 { id, name, districtId, address, lat, lng }
//   state          : loadImportState() 결과
//   edits          : { [로컬 일지 ID]: 고쳐 쓴 내용 } (20자 미만 일지를 이전 전에 고친 것)
// 일지 상태: importable(이전 가능) · done(이미 이전함) · existing(계정에 이미 있음) · sample(예시 빵집) · no_bakery_info(빵집 정보 필요) · too_short(고쳐 쓰면 가능) · too_long
export const buildImportPlan = ({ snapshot, account, registeredIds, bakeryInfoById, state, edits = {} }) => {
  const nicknameByUserId = Object.fromEntries(snapshot.profiles.map((profile) => [profile.userId, profile.nickname]))
  const hasBakeryInfo = (bakeryId) => registeredIds.has(bakeryId) || Number.isFinite(bakeryInfoById.get(bakeryId)?.lat)

  const reviews = snapshot.reviews.map((review) => {
    const key = `review:${review.id}`
    const bakeryId = String(review.bakeryId)
    const info = bakeryInfoById.get(bakeryId)
    const originalContent = String(review.content ?? '')
    const content = Object.hasOwn(edits, review.id) ? String(edits[review.id]) : originalContent
    const contentStatus = getReviewContentStatus(content)
    const photo = classifyPhoto(review.photo)
    const base = {
      key,
      kind: 'review',
      localId: review.id,
      localNickname: nicknameByUserId[review.userId] ?? review.authorNickname ?? '알 수 없음',
      bakeryId,
      bakeryName: review.bakeryName || info?.name || `빵집 ${bakeryId}`,
      districtId: review.districtId ?? info?.districtId ?? null,
      rating: review.rating,
      originalContent,
      content,
      edited: Object.hasOwn(edits, review.id), // 이전 전에 고쳐 쓰는 중인 일지 (입력창을 계속 보여주려고 표시해요)
      photo,
      photoData: review.photo ?? null,
      createdAt: review.createdAt ?? null,
    }
    const done = state.items[key]
    if (done) return { ...base, status: 'done', reason: done.status === 'done' ? '이미 이전했어요' : '이전할 때 계정에 이미 있어서 건너뛰었어요' }
    if (review.bakerySource === 'sample' || !isDigits(bakeryId)) {
      return { ...base, status: 'sample', reason: '예시 빵집의 일지라서 이전할 수 없어요 (서버에는 실제 빵집만 저장돼요)' }
    }
    if (account.reviewBakeryIds.has(bakeryId)) {
      return { ...base, status: 'existing', reason: '이 빵집에는 내 계정에 이미 일지가 있어서 건너뛰어요 (덮어쓰지 않아요)' }
    }
    if (!hasBakeryInfo(bakeryId)) {
      return { ...base, status: 'no_bakery_info', reason: '빵집 위치 정보를 지금 불러오지 못했어요. 지도에서 해당 지역을 한 번 열어 본 뒤 다시 시도해 주세요' }
    }
    if (contentStatus.isTooLong) return { ...base, status: 'too_long', reason: '내용이 500자를 넘어서 줄여 써야 이전할 수 있어요', contentStatus }
    if (contentStatus.isTooShort) {
      return { ...base, status: 'too_short', reason: `내용이 너무 짧아요 (공백을 뺀 ${contentStatus.meaningfulLength}자). 20자 이상으로 고쳐 쓰면 이전할 수 있어요`, contentStatus }
    }
    return { ...base, status: 'importable', reason: null, contentStatus }
  })

  // 같은 빵집의 일지가 여러 개면(여러 임시 프로필) 계정에는 빵집당 1개만 저장돼요 → 먼저 나온 것만 이전 가능, 나머지는 건너뛰어요
  // (바로 이전 가능한 일지가 우선이고, 고쳐 써야 하는 일지는 그다음이에요)
  const claimed = new Set()
  for (const wanted of ['importable', 'too_short']) {
    for (const review of reviews) {
      if (review.status !== wanted) continue
      if (claimed.has(review.bakeryId)) {
        review.status = 'duplicate'
        review.reason = '같은 빵집의 다른 일지가 먼저 이전돼요 (계정에는 빵집당 일지 1개만 저장돼요)'
      } else {
        claimed.add(review.bakeryId)
      }
    }
  }

  const visits = snapshot.visitedIds.map((bakeryId) => {
    const key = `visit:${bakeryId}`
    const info = bakeryInfoById.get(bakeryId)
    const base = { key, kind: 'visit', bakeryId, bakeryName: info?.name || snapshot.reviews.find((r) => String(r.bakeryId) === bakeryId)?.bakeryName || `빵집 ${bakeryId}`, districtId: info?.districtId ?? null }
    if (state.items[key]) return { ...base, status: 'done', reason: '이미 이전했어요' }
    if (!isDigits(bakeryId)) return { ...base, status: 'sample', reason: '예시 빵집이라서 이전할 수 없어요' }
    if (account.visitBakeryIds.has(bakeryId)) return { ...base, status: 'existing', reason: '이미 내 계정에 체크돼 있어요' }
    if (!hasBakeryInfo(bakeryId)) return { ...base, status: 'no_bakery_info', reason: '빵집 위치 정보를 지금 불러오지 못했어요. 지도에서 해당 지역을 한 번 열어 본 뒤 다시 시도해 주세요' }
    return { ...base, status: 'importable', reason: null }
  })

  const countBy = (items) => items.reduce((acc, item) => ({ ...acc, [item.status]: (acc[item.status] ?? 0) + 1 }), {})
  return { reviews, visits, reviewCounts: countBy(reviews), visitCounts: countBy(visits) }
}

// 서버에 보낼 입력 (선택된 항목만, 이전 가능한 것만)
export const toImportItems = (plan, selectedKeys, bakeryInfoById) => {
  const selected = new Set(selectedKeys)
  const items = []
  for (const review of plan.reviews) {
    if (review.status !== 'importable' || !selected.has(review.key)) continue
    const info = bakeryInfoById.get(review.bakeryId)
    items.push({
      key: review.key,
      kind: 'review',
      label: review.bakeryName,
      input: {
        bakeryId: review.bakeryId,
        bakerySource: 'kakao',
        bakeryName: review.bakeryName,
        districtId: review.districtId,
        bakeryLat: info?.lat,
        bakeryLng: info?.lng,
        bakeryAddress: info?.address,
        rating: review.rating,
        content: review.content,
        photo: review.photo.ok ? review.photoData : null,
      },
      photoNote: review.photo.hasPhoto && !review.photo.ok ? review.photo.reason : null,
    })
  }
  for (const visit of plan.visits) {
    if (visit.status !== 'importable' || !selected.has(visit.key)) continue
    const info = bakeryInfoById.get(visit.bakeryId)
    items.push({ key: visit.key, kind: 'visit', label: visit.bakeryName, input: { id: visit.bakeryId, name: info?.name ?? visit.bakeryName, districtId: info?.districtId ?? visit.districtId, lat: info?.lat, lng: info?.lng, address: info?.address } })
  }
  return items
}

// ── EXP · 한도 미리 계산 (서버 규칙과 같은 계산, 진짜 지급은 서버가 정해요) ──
export const simulateImportExp = ({ accountReviews, items, settings, now = new Date() }) => {
  let working = [...accountReviews]
  const baseline = buildGameState(accountReviews)
  let savableToday = 0
  let deferred = 0
  let expTargets = 0
  let noExp = 0
  for (const item of items.filter((i) => i.kind === 'review')) {
    const hasPhoto = Boolean(item.input.photo)
    const prediction = predictNewReviewExp(working, { hasPhoto, settings, now })
    if (prediction.limitReached) {
      deferred += 1
      continue
    }
    savableToday += 1
    if (prediction.expReview) expTargets += 1
    else noExp += 1
    working = [
      { id: `import-${item.key}`, bakeryId: item.input.bakeryId, bakerySource: 'kakao', districtId: item.input.districtId ?? null, photo: hasPhoto ? 'photo' : null, expReview: prediction.expReview, expPhoto: prediction.expPhoto, createdAt: now.toISOString() },
      ...working,
    ]
  }
  const expGain = diffGameState(baseline, buildGameState(working)).expGained
  return { savableToday, deferred, expTargets, noExp, expGain }
}

// ── 이전 실행 ──
// 하나씩 저장해요. 최종 확인(confirmed)이 없으면 아무것도 저장하지 않고 오류를 던져요.
const ITEM_LEVEL_CODES = ['BAKERY_REJECTED', 'INVALID_BAKERY', 'INVALID_INPUT', 'CONTENT_TOO_SHORT', 'CONTENT_TOO_LONG', 'SAMPLE_BAKERY', 'INVALID_PHOTO', 'NOT_FOUND']

export const STOP_REASON_TEXT = {
  daily_limit: '오늘 저장할 수 있는 일지(하루 20개)를 모두 썼어요. 남은 기록은 내일 이어서 가져올 수 있어요.',
  rate_limited: '빵집 확인 요청이 너무 많아요. 몇 분 뒤에 이어서 가져와 주세요.',
  user: '가져오기를 멈췄어요. 남은 기록은 이어서 가져올 수 있어요.',
}

export const runImport = async ({ items, confirmed, deps, onProgress = () => {}, shouldStop = () => false }) => {
  if (confirmed !== true) throw new Error('최종 확인을 받기 전에는 서버에 저장하지 않아요.')
  const results = []
  let stopped = null

  for (let index = 0; index < items.length; index += 1) {
    if (shouldStop()) {
      stopped = { reason: 'user', message: STOP_REASON_TEXT.user }
      break
    }
    const item = items[index]
    onProgress({ index, total: items.length, item, results: [...results] })
    try {
      if (item.kind === 'visit') {
        await deps.addVisit(item.input)
        deps.saveState(item.key, 'done')
        results.push({ key: item.key, kind: 'visit', label: item.label, status: 'success' })
        continue
      }
      let photoDropped = item.photoNote
      let created
      try {
        created = await deps.createReview(item.input)
      } catch (error) {
        // 사진 때문에 글이 유실되지 않게: 사진 없이 한 번 더 저장해요 (사진 저장이 실패한 경우에는 일지가 아직 저장되지 않았어요)
        if (error?.code === 'PHOTO_FAILED' && item.input.photo) {
          photoDropped = '사진을 서버에 올리지 못해서 글만 가져왔어요'
          created = await deps.createReview({ ...item.input, photo: null })
        } else {
          throw error
        }
      }
      deps.saveState(item.key, 'done')
      results.push({ key: item.key, kind: 'review', label: item.label, status: photoDropped ? 'success_no_photo' : 'success', message: photoDropped ?? null, expReview: created?.expReview, expPhoto: created?.expPhoto })
    } catch (error) {
      if (error?.code === 'DUPLICATE_REVIEW') {
        // 이미 계정에 있어요 → 덮어쓰지 않고 건너뛰어요 (중간에 멈췄다가 다시 시도한 경우에도 여기로 와요)
        deps.saveState(item.key, 'existing')
        results.push({ key: item.key, kind: item.kind, label: item.label, status: 'existing', message: '이미 계정에 있어서 건너뛰었어요' })
        continue
      }
      if (ITEM_LEVEL_CODES.includes(error?.code)) {
        results.push({ key: item.key, kind: item.kind, label: item.label, status: 'failed', message: error.message })
        continue
      }
      // 한도 · 연결 · 로그인 · 서버 문제는 계속 시도하지 않고 여기서 멈춰요 (성공한 기록은 그대로, 남은 기록부터 이어서 가능)
      const reason = error?.code === 'DAILY_REVIEW_LIMIT' ? 'daily_limit' : error?.code === 'RATE_LIMITED' ? 'rate_limited' : 'error'
      stopped = { reason, message: reason === 'error' ? `${error?.message ?? '알 수 없는 오류'}` : STOP_REASON_TEXT[reason], code: error?.code ?? null }
      // 한도 · 요청 제한은 저장 전에 거절된 것(시도 안 함), 그 밖의 오류는 이 항목이 실패한 것으로 보여줘요
      results.push({ key: item.key, kind: item.kind, label: item.label, status: reason === 'error' ? 'failed' : 'not_attempted', message: reason === 'error' ? error?.message : STOP_REASON_TEXT[reason] })
      for (const rest of items.slice(index + 1)) results.push({ key: rest.key, kind: rest.kind, label: rest.label, status: 'not_attempted', message: '앞에서 멈춰서 아직 시도하지 않았어요' })
      return { results, stopped }
    }
  }
  if (stopped) {
    for (const rest of items.slice(results.length)) results.push({ key: rest.key, kind: rest.kind, label: rest.label, status: 'not_attempted', message: '아직 시도하지 않았어요' })
  }
  return { results, stopped }
}

export const summarizeResults = (results) => {
  const count = (...statuses) => results.filter((r) => statuses.includes(r.status)).length
  return {
    success: count('success', 'success_no_photo'),
    noPhoto: count('success_no_photo'),
    existing: count('existing'),
    failed: count('failed'),
    notAttempted: count('not_attempted'),
  }
}
