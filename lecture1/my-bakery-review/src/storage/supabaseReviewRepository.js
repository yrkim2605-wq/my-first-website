import { RepositoryError } from './localStore'
import { AUTH_NETWORK_MESSAGE } from './authMessages'

// 리뷰(모험 일지) 저장소 — Supabase 버전이에요. 로컬 저장소(reviewRepository)와 같은 함수 이름 · 같은 리뷰 모양을 돌려줘서
// 화면 코드는 거의 그대로예요. 다른 점:
//  - 연결에 실패하면 로컬에 대신 저장하지 않고 오류를 던져요 ("저장했다"고 보이지 않아요).
//  - EXP는 서버(DB 트리거)가 정해요. 이 파일은 EXP 값을 보내지 않고, 서버가 정한 expReview / expPhoto를 읽어 오기만 해요.
//  - 예시 빵집(숫자 ID)은 DB에 없어서 저장할 수 없어요. 실제(카카오) 빵집만 저장돼요.
//  - 처음 쓰는 빵집은 서버 함수(register-bakery)가 카카오로 실제 존재를 확인한 뒤 등록해요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)

const REVIEW_COLUMNS =
  'id, user_id, bakery_id, rating, content, photo_path, exp_review, exp_photo, created_at, updated_at, profiles(nickname), bakeries(name, district_id)'
const LIST_LIMIT = 500
const PHOTO_BUCKET = 'photos'

const messages = {
  NOT_SIGNED_IN: '로그인이 필요해요. 이메일로 로그인한 뒤 다시 시도해 주세요.',
  SESSION_EXPIRED: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  DUPLICATE_REVIEW: '이미 이 빵집에 기록을 남겼어요. 기록을 고쳐 쓸 수 있어요.',
  INVALID_BAKERY: '아직 등록되지 않은 빵집이라 저장할 수 없어요. 잠시 후 다시 시도해 주세요.',
  SAMPLE_BAKERY: '예시 빵집에는 일지를 저장할 수 없어요. 지도에서 실제 빵집을 골라 주세요.',
  DAILY_REVIEW_LIMIT: '오늘은 일지를 너무 많이 썼어요 (하루 20개까지). 내일 다시 써 주세요.',
  EMAIL_NOT_CONFIRMED: '이메일 인증을 마친 뒤에 쓸 수 있어요.',
  INVALID_INPUT: '별점과 내용을 다시 확인해 주세요 (내용은 1~500자).',
  PHOTO_FAILED: '사진을 올리지 못했어요. 사진을 빼거나 다른 사진으로 다시 시도해 주세요. (일지는 저장되지 않았어요)',
  FUNCTION_MISSING: '빵집 확인 기능이 아직 설정되지 않았어요. 관리자(서버 설정)가 필요해요. (일지는 저장되지 않았어요)',
  BAKERY_REJECTED: '이 빵집은 확인하지 못했어요. 지도에서 다시 골라 주세요.',
  UNKNOWN: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  NOT_FOUND: '일지를 찾을 수 없어요. (이미 지워졌거나 내가 쓴 일지가 아니에요)',
}

const isNetworkError = (error) =>
  error?.name === 'AuthRetryableFetchError' ||
  error instanceof TypeError ||
  /failed to fetch|networkerror|load failed|network request failed/i.test(String(error?.message ?? ''))

// Supabase / 저장소 오류 → 사용자에게 보여줄 한국어 안내
export const toReviewError = (error) => {
  if (error instanceof RepositoryError) return error
  if (isNetworkError(error)) return new RepositoryError('NETWORK', AUTH_NETWORK_MESSAGE)
  const text = String(error?.message ?? '')
  if (error?.code === '23505') return new RepositoryError('DUPLICATE_REVIEW', messages.DUPLICATE_REVIEW)
  if (error?.code === '23503') return new RepositoryError('INVALID_BAKERY', messages.INVALID_BAKERY)
  if (error?.code === '23514') return new RepositoryError('INVALID_INPUT', messages.INVALID_INPUT)
  if (/DAILY_REVIEW_LIMIT/.test(text)) return new RepositoryError('DAILY_REVIEW_LIMIT', messages.DAILY_REVIEW_LIMIT)
  if (/EMAIL_NOT_VERIFIED/.test(text)) return new RepositoryError('EMAIL_NOT_CONFIRMED', messages.EMAIL_NOT_CONFIRMED)
  if (/NOT_SIGNED_IN|jwt expired|invalid jwt/i.test(text) || error?.code === 'PGRST301' || error?.code === '28000') {
    return new RepositoryError('SESSION_EXPIRED', messages.SESSION_EXPIRED)
  }
  if (error?.code === '42501' || /row-level security|permission denied/i.test(text)) {
    return new RepositoryError('FORBIDDEN', '이 작업을 할 권한이 없어요. 내가 쓴 일지만 고치거나 지울 수 있어요.')
  }
  return new RepositoryError('UNKNOWN', messages.UNKNOWN)
}

const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob()
const isRemoteUrl = (value) => typeof value === 'string' && /^https?:\/\//.test(value)
const newPhotoName = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)

export const createSupabaseReviewRepository = (getClient) => {
  const requireUserId = async (client) => {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    const userId = data.session?.user?.id
    if (!userId) throw new RepositoryError('NOT_SIGNED_IN', messages.NOT_SIGNED_IN)
    return userId
  }

  const toReview = (client, row) => ({
    id: row.id,
    clientRequestId: null,
    userId: row.user_id,
    authorNickname: row.profiles?.nickname ?? '',
    bakeryId: row.bakery_id,
    bakerySource: 'kakao',
    bakeryName: row.bakeries?.name ?? '',
    districtId: row.bakeries?.district_id ?? null,
    rating: Number(row.rating),
    content: row.content,
    photo: row.photo_path ? client.storage.from(PHOTO_BUCKET).getPublicUrl(row.photo_path).data.publicUrl : null,
    photoPath: row.photo_path ?? null,
    expReview: row.exp_review === true,
    expPhoto: row.exp_photo === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })

  const byNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)

  // 빵집이 DB에 있는지 확인하고, 없으면 서버 함수로 등록해요 (카카오로 실제 존재를 확인한 뒤에만 등록돼요)
  const ensureBakeryRegistered = async (client, input) => {
    const { data: existing, error: lookupError } = await client.from('bakeries').select('id').eq('id', input.bakeryId).maybeSingle()
    if (lookupError) throw lookupError
    if (existing) return
    const { error } = await client.functions.invoke('register-bakery', {
      body: {
        id: input.bakeryId,
        name: input.bakeryName,
        districtId: input.districtId,
        lat: input.bakeryLat,
        lng: input.bakeryLng,
        address: input.bakeryAddress ?? null,
      },
    })
    if (!error) return
    // 함수가 돌려준 오류 내용 읽기
    let detail = null
    try {
      detail = await error.context?.json?.()
    } catch {
      // 본문이 JSON이 아니면 무시
    }
    const status = error.context?.status
    if (status === 404) throw new RepositoryError('FUNCTION_MISSING', messages.FUNCTION_MISSING)
    if (status === 401 || status === 403) throw new RepositoryError('SESSION_EXPIRED', messages.SESSION_EXPIRED)
    if (status === 429) throw new RepositoryError('RATE_LIMITED', '빵집 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요. (일지는 저장되지 않았어요)')
    if (status === 400 || status === 422) {
      throw new RepositoryError('BAKERY_REJECTED', detail?.error?.message || messages.BAKERY_REJECTED)
    }
    throw error
  }

  const uploadPhoto = async (client, userId, photoDataUrl) => {
    const path = `${userId}/${newPhotoName()}.jpg`
    try {
      const blob = await dataUrlToBlob(photoDataUrl)
      const { error } = await client.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      return path
    } catch (error) {
      if (isNetworkError(error)) throw new RepositoryError('NETWORK', AUTH_NETWORK_MESSAGE)
      throw new RepositoryError('PHOTO_FAILED', messages.PHOTO_FAILED)
    }
  }

  // 사진 정리는 실패해도 일지 저장 결과에는 영향을 주지 않아요 (남는 파일은 내 폴더에만 있어요)
  const removePhotoQuietly = async (client, path) => {
    if (!path) return
    try {
      await client.storage.from(PHOTO_BUCKET).remove([path])
    } catch {
      // 무시
    }
  }

  return {
    // 최신 일지 최대 500개 + 내 일지 전체 (내 EXP · 도감 · 배지는 내 일지 전체로 계산해야 해서 따로 가져와요)
    async list() {
      try {
        const client = await getClient()
        const { data: session } = await client.auth.getSession()
        const myId = session?.session?.user?.id ?? null
        const recent = await client.from('reviews').select(REVIEW_COLUMNS).order('created_at', { ascending: false }).limit(LIST_LIMIT)
        if (recent.error) throw recent.error
        let rows = recent.data ?? []
        if (myId) {
          const mine = await client.from('reviews').select(REVIEW_COLUMNS).eq('user_id', myId).order('created_at', { ascending: false }).limit(1000)
          if (mine.error) throw mine.error
          const seen = new Set(rows.map((row) => row.id))
          rows = [...rows, ...(mine.data ?? []).filter((row) => !seen.has(row.id))]
        }
        return rows.map((row) => toReview(client, row)).sort(byNewest)
      } catch (error) {
        throw toReviewError(error)
      }
    },

    // 작성자 레벨 표시용: 사용자별 레벨 번호(0~4). 서버가 계산한 값이에요 (user_progress 뷰).
    async listLevels() {
      try {
        const client = await getClient()
        const { data, error } = await client.from('user_progress').select('user_id, level_index').gt('review_count', 0).limit(2000)
        if (error) throw error
        return Object.fromEntries((data ?? []).map((row) => [row.user_id, Number(row.level_index)]))
      } catch (error) {
        throw toReviewError(error)
      }
    },

    // 서버 게임 설정 (하루 EXP 상한 등). 화면의 예상 EXP 미리보기가 서버 값을 따라가게 해요.
    async getSettings() {
      try {
        const client = await getClient()
        const { data, error } = await client.from('game_settings').select('key, value')
        if (error) throw error
        const map = Object.fromEntries((data ?? []).map((row) => [row.key, Number(row.value)]))
        return { dailyExpCap: map.daily_exp_cap, reviewExp: map.review_exp, photoExp: map.photo_exp }
      } catch (error) {
        throw toReviewError(error)
      }
    },

    async create(input) {
      const { bakeryId, bakerySource, rating, content, photo = null } = input
      if (bakerySource === 'sample') throw new RepositoryError('SAMPLE_BAKERY', messages.SAMPLE_BAKERY)
      let uploadedPath = null
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        await ensureBakeryRegistered(client, { ...input, bakeryId: String(bakeryId) })
        if (photo) {
          if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
            throw new RepositoryError('INVALID_PHOTO', '사진 형식이 올바르지 않아요.')
          }
          uploadedPath = await uploadPhoto(client, userId, photo)
        }
        // EXP 칸은 보내지 않아요. 서버 트리거가 정해서 돌려줘요.
        const { data, error } = await client
          .from('reviews')
          .insert({ bakery_id: String(bakeryId), rating, content: String(content ?? '').trim(), photo_path: uploadedPath })
          .select(REVIEW_COLUMNS)
          .single()
        if (error) throw error
        return toReview(client, data)
      } catch (error) {
        // 저장에 실패하면 방금 올린 사진은 지워서 파일이 남지 않게 해요
        if (uploadedPath) await removePhotoQuietly(await getClient().catch(() => null), uploadedPath)
        throw toReviewError(error)
      }
    },

    // 내 일지만 고칠 수 있어요. photo: undefined = 그대로 / null = 사진 지우기 / data URL = 새 사진 / 이미 올라간 주소 = 그대로
    async update(reviewId, _userId, { rating, content, photo }) {
      let newPath = null
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const current = await client.from('reviews').select('id, photo_path').eq('id', reviewId).eq('user_id', userId).maybeSingle()
        if (current.error) throw current.error
        if (!current.data) throw new RepositoryError('NOT_FOUND', messages.NOT_FOUND)

        const patch = {}
        if (rating !== undefined) patch.rating = rating
        if (content !== undefined) patch.content = String(content).trim()
        const photoChanged = photo === null || (typeof photo === 'string' && !isRemoteUrl(photo))
        if (photo === null) patch.photo_path = null
        else if (photoChanged) {
          if (!photo.startsWith('data:image/')) throw new RepositoryError('INVALID_PHOTO', '사진 형식이 올바르지 않아요.')
          newPath = await uploadPhoto(client, userId, photo)
          patch.photo_path = newPath
        }

        const { data, error } = await client.from('reviews').update(patch).eq('id', reviewId).eq('user_id', userId).select(REVIEW_COLUMNS).single()
        if (error) throw error
        if (photoChanged) await removePhotoQuietly(client, current.data.photo_path) // 이전 사진 정리
        return toReview(client, data)
      } catch (error) {
        if (newPath) await removePhotoQuietly(await getClient().catch(() => null), newPath)
        throw toReviewError(error)
      }
    },

    async remove(reviewId) {
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const { data, error } = await client.from('reviews').delete().eq('id', reviewId).eq('user_id', userId).select('id, photo_path')
        if (error) throw error
        if (!data || data.length === 0) throw new RepositoryError('NOT_FOUND', messages.NOT_FOUND)
        await removePhotoQuietly(client, data[0].photo_path)
      } catch (error) {
        throw toReviewError(error)
      }
    },

    // 다른 기기 변경은 다시 불러올 때 반영돼요 (실시간 구독은 쓰지 않아요)
    subscribe() {
      return () => {}
    },
  }
}
