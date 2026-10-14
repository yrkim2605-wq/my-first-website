import { RepositoryError } from './localStore'
import { AUTH_NETWORK_MESSAGE } from './authMessages'
import { ensureBakeryRegistered, isNetworkError, messages, toReviewError } from './supabaseShared'
import { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN, getReviewContentStatus } from '../utils/reviewContent'

// 테스트 · 기존 코드가 이 파일에서 가져다 쓰던 이름을 그대로 유지해요
export { toReviewError }

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

// 화면 검사를 우회해도 서버(0006)가 한 번 더 막지만, 보내기 전에 먼저 확인해서 불필요한 요청(빵집 확인 · 사진 업로드)을 하지 않아요.
// 앞뒤 공백을 뺀 내용을 돌려줘요. 규칙은 utils/reviewContent.js.
const validateContent = (rawContent) => {
  const content = String(rawContent ?? '').trim()
  const status = getReviewContentStatus(content)
  if (status.isTooShort) throw new RepositoryError('CONTENT_TOO_SHORT', `내용이 너무 짧아요. 공백을 뺀 글자 수로 ${REVIEW_CONTENT_MIN}자 이상 써 주세요. (저장되지 않았어요)`)
  if (status.isTooLong) throw new RepositoryError('CONTENT_TOO_LONG', `내용이 너무 길어요. ${REVIEW_CONTENT_MAX}자 이하로 줄여 주세요. (저장되지 않았어요)`)
  return content
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
        throw toReviewError(error, 'read')
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
        throw toReviewError(error, 'read')
      }
    },

    // 빵집별 평균 별점 · 리뷰 개수: 서버가 모든 사용자의 리뷰로 계산한 값이에요 (ranking_bakeries 뷰, 0005).
    // 결과: { '<빵집 ID>': { average: 4.3, count: 3 } } — 리뷰가 없는 빵집은 들어 있지 않아요(= 0개).
    // 한 번에 1000줄까지만 줘서 여러 번에 나눠 모두 가져와요 (일부가 조용히 빠지지 않게).
    async listRatingStats() {
      try {
        const client = await getClient()
        const stats = {}
        const PAGE = 1000
        for (let page = 0; page < 20; page += 1) {
          const { data, error } = await client
            .from('ranking_bakeries')
            .select('bakery_id, review_count, avg_rating')
            .order('bakery_id', { ascending: true })
            .range(page * PAGE, page * PAGE + PAGE - 1)
          if (error) throw error
          for (const row of data ?? []) stats[String(row.bakery_id)] = { average: Number(row.avg_rating), count: Number(row.review_count) }
          if (!data || data.length < PAGE) break
        }
        return stats
      } catch (error) {
        throw toReviewError(error, 'read')
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
        throw toReviewError(error, 'read')
      }
    },

    async create(input) {
      const { bakeryId, bakerySource, rating, content, photo = null } = input
      if (bakerySource === 'sample') throw new RepositoryError('SAMPLE_BAKERY', messages.SAMPLE_BAKERY)
      const cleanContent = validateContent(content)
      let uploadedPath = null
      let step = 'register' // 어디서 실패했는지 알려주려고 단계를 기억해요: register(빵집 확인) → photo(사진) → insert(일지 저장)
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        await ensureBakeryRegistered(client, { ...input, bakeryId: String(bakeryId) })
        step = 'photo'
        if (photo) {
          if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
            throw new RepositoryError('INVALID_PHOTO', '사진 형식이 올바르지 않아요.')
          }
          uploadedPath = await uploadPhoto(client, userId, photo)
        }
        // EXP 칸은 보내지 않아요. 서버 트리거가 정해서 돌려줘요.
        step = 'insert'
        const { data, error } = await client
          .from('reviews')
          .insert({ bakery_id: String(bakeryId), rating, content: cleanContent, photo_path: uploadedPath })
          .select(REVIEW_COLUMNS)
          .single()
        if (error) throw error
        return toReview(client, data)
      } catch (error) {
        // 저장에 실패하면 방금 올린 사진은 지워서 파일이 남지 않게 해요
        if (uploadedPath) await removePhotoQuietly(await getClient().catch(() => null), uploadedPath)
        throw toReviewError(error, step)
      }
    },

    // 내 일지만 고칠 수 있어요. photo: undefined = 그대로 / null = 사진 지우기 / data URL = 새 사진 / 이미 올라간 주소 = 그대로
    async update(reviewId, _userId, { rating, content, photo }) {
      // 고칠 때도 새로 쓸 때와 같은 글자 수 규칙이에요 (내용을 보내는 경우)
      const cleanContent = content === undefined ? undefined : validateContent(content)
      let newPath = null
      try {
        const client = await getClient()
        const userId = await requireUserId(client)
        const current = await client.from('reviews').select('id, photo_path').eq('id', reviewId).eq('user_id', userId).maybeSingle()
        if (current.error) throw current.error
        if (!current.data) throw new RepositoryError('NOT_FOUND', messages.NOT_FOUND)

        const patch = {}
        if (rating !== undefined) patch.rating = rating
        if (cleanContent !== undefined) patch.content = cleanContent
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
        throw toReviewError(error, 'update')
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
        throw toReviewError(error, 'delete')
      }
    },

    // 다른 기기 변경은 다시 불러올 때 반영돼요 (실시간 구독은 쓰지 않아요)
    subscribe() {
      return () => {}
    },
  }
}
