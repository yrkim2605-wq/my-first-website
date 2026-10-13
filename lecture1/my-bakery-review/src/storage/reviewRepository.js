import { RepositoryError, createId, readJson, subscribeToKey, writeJson } from './localStore'

// 리뷰 저장소예요 (localStorage). ⚠️ 이 브라우저에만 저장되고 다른 사용자와 공유되지 않아요.
//
// 저장 모양 (버전 1):
//   { version: 1, reviews: [Review] }
//   Review = {
//     id,                 // 리뷰 고유 ID (UUID)
//     clientRequestId,    // 같은 제출이 두 번 들어와도 한 번만 저장하려고 쓰는 값
//     userId,             // 작성한 프로필 (profileRepository의 userId)
//     bakeryId,           // 빵집 ID (카카오 장소 ID는 문자열, 샘플 빵집은 숫자 → 항상 문자열로 저장)
//     bakerySource,       // 'kakao' | 'sample'
//     bakeryName,         // 저장 당시 빵집 이름 (카카오 검색 결과가 바뀌어도 기록이 남게)
//     districtId,         // 저장 당시 지역 ID (지역 탐험 퀘스트 계산용), 없으면 null
//     rating, content, photo (JPEG data URL | null),
//     createdAt, updatedAt  // ISO 문자열
//   }
// 규칙: 한 사용자는 한 빵집에 리뷰를 1개만 남기고, 고쳐 쓸 수 있어요 (중복 저장 · 경험치 중복 방지).
// 모든 함수가 Promise를 돌려줘서, 나중에 Supabase 같은 DB로 바꿔도 호출하는 쪽은 그대로예요.

export const REVIEWS_STORAGE_KEY = 'my-bakery-review:v1:reviews'

export const REVIEW_CONTENT_MAX = 500

const EMPTY_STATE = { version: 1, reviews: [] }

const readState = () => {
  const state = readJson(REVIEWS_STORAGE_KEY, EMPTY_STATE)
  if (!state || !Array.isArray(state.reviews)) return { ...EMPTY_STATE }
  return { ...EMPTY_STATE, ...state }
}

const byNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)

const validateRating = (rating) => {
  const isHalfStep = Number.isFinite(rating) && rating >= 0.5 && rating <= 5 && Number.isInteger(rating * 2)
  if (!isHalfStep) throw new RepositoryError('INVALID_RATING', '별점을 골라주세요.')
  return rating
}

const validateContent = (rawContent) => {
  const content = (rawContent ?? '').trim()
  if (!content) throw new RepositoryError('INVALID_CONTENT', '리뷰 내용을 입력해주세요.')
  if (content.length > REVIEW_CONTENT_MAX) {
    throw new RepositoryError('INVALID_CONTENT', `리뷰는 ${REVIEW_CONTENT_MAX}자까지 쓸 수 있어요.`)
  }
  return content
}

const validatePhoto = (photo) => {
  if (photo == null) return null
  if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
    throw new RepositoryError('INVALID_PHOTO', '사진 형식이 올바르지 않아요.')
  }
  return photo
}

export const reviewRepository = {
  async list() {
    return [...readState().reviews].sort(byNewest)
  },

  async listByBakery(bakeryId) {
    return (await this.list()).filter((review) => review.bakeryId === String(bakeryId))
  },

  async listByUser(userId) {
    return (await this.list()).filter((review) => review.userId === userId)
  },

  // 새 리뷰를 저장해요. 저장에 성공했을 때만 리뷰를 돌려줘요 (실패하면 오류를 던져요).
  async create({ userId, bakeryId, bakerySource, bakeryName, districtId = null, rating, content, photo = null, clientRequestId }) {
    if (!userId) throw new RepositoryError('NOT_SIGNED_IN', '리뷰를 남기려면 먼저 로그인해주세요.')
    const normalizedBakeryId = String(bakeryId)
    const state = readState()

    // 같은 제출이 다시 들어오면(더블 클릭 · 재시도) 새로 만들지 않고 이미 저장된 리뷰를 돌려줘요.
    const alreadySaved = clientRequestId && state.reviews.find((review) => review.clientRequestId === clientRequestId)
    if (alreadySaved) return alreadySaved

    if (state.reviews.some((review) => review.userId === userId && review.bakeryId === normalizedBakeryId)) {
      throw new RepositoryError('DUPLICATE_REVIEW', '이미 이 빵집에 기록을 남겼어요. 기록을 고쳐 쓸 수 있어요.')
    }

    const now = new Date().toISOString()
    const review = {
      id: createId(),
      clientRequestId: clientRequestId ?? null,
      userId,
      bakeryId: normalizedBakeryId,
      bakerySource: bakerySource === 'sample' ? 'sample' : 'kakao',
      bakeryName: String(bakeryName ?? ''),
      districtId,
      rating: validateRating(rating),
      content: validateContent(content),
      photo: validatePhoto(photo),
      createdAt: now,
      updatedAt: now,
    }
    writeJson(REVIEWS_STORAGE_KEY, { ...state, reviews: [review, ...state.reviews] })
    return review
  },

  // 내가 쓴 리뷰만 고칠 수 있어요. 빵집 · 작성자 · 작성일은 바뀌지 않아요.
  async update(reviewId, userId, { rating, content, photo }) {
    const state = readState()
    const target = state.reviews.find((review) => review.id === reviewId)
    if (!target) throw new RepositoryError('REVIEW_NOT_FOUND', '리뷰를 찾을 수 없어요.')
    if (target.userId !== userId) throw new RepositoryError('FORBIDDEN', '내가 쓴 리뷰만 고칠 수 있어요.')

    const updated = {
      ...target,
      rating: rating === undefined ? target.rating : validateRating(rating),
      content: content === undefined ? target.content : validateContent(content),
      photo: photo === undefined ? target.photo : validatePhoto(photo),
      updatedAt: new Date().toISOString(),
    }
    writeJson(REVIEWS_STORAGE_KEY, {
      ...state,
      reviews: state.reviews.map((review) => (review.id === reviewId ? updated : review)),
    })
    return updated
  },

  async remove(reviewId, userId) {
    const state = readState()
    const target = state.reviews.find((review) => review.id === reviewId)
    if (!target) throw new RepositoryError('REVIEW_NOT_FOUND', '리뷰를 찾을 수 없어요.')
    if (target.userId !== userId) throw new RepositoryError('FORBIDDEN', '내가 쓴 리뷰만 지울 수 있어요.')
    writeJson(REVIEWS_STORAGE_KEY, { ...state, reviews: state.reviews.filter((review) => review.id !== reviewId) })
  },

  subscribe(onChange) {
    return subscribeToKey(REVIEWS_STORAGE_KEY, onChange)
  },
}
