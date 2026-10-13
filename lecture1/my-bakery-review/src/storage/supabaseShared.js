import { RepositoryError } from './localStore'
import { AUTH_NETWORK_MESSAGE } from './authMessages'

// Supabase 저장소들(리뷰 · 방문 체크)이 같이 쓰는 도우미예요: 오류 → 한국어 안내, 빵집 DB 등록 확인.

export const messages = {
  NOT_SIGNED_IN: '로그인이 필요해요. 이메일로 로그인한 뒤 다시 시도해 주세요.',
  SESSION_EXPIRED: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  DUPLICATE_REVIEW: '이미 이 빵집에 기록을 남겼어요. 기록을 고쳐 쓸 수 있어요.',
  INVALID_BAKERY: '아직 등록되지 않은 빵집이라 저장할 수 없어요. 잠시 후 다시 시도해 주세요.',
  SAMPLE_BAKERY: '예시 빵집에는 일지를 저장할 수 없어요. 지도에서 실제 빵집을 골라 주세요.',
  DAILY_REVIEW_LIMIT: '오늘은 일지를 너무 많이 썼어요 (하루 20개까지). 내일 다시 써 주세요.',
  EMAIL_NOT_CONFIRMED: '이메일 인증을 마친 뒤에 쓸 수 있어요.',
  INVALID_INPUT: '별점과 내용을 다시 확인해 주세요 (내용은 1~500자).',
  PHOTO_FAILED: '사진을 올리지 못했어요. 사진을 빼거나 다른 사진으로 다시 시도해 주세요. (저장되지 않았어요)',
  FUNCTION_MISSING: '빵집 확인 기능이 아직 설정되지 않았어요. 관리자(서버 설정)가 필요해요. (저장되지 않았어요)',
  BAKERY_REJECTED: '이 빵집은 확인하지 못했어요. 지도에서 다시 골라 주세요.',
  UNKNOWN: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  NOT_FOUND: '일지를 찾을 수 없어요. (이미 지워졌거나 내가 쓴 일지가 아니에요)',
}

export const isNetworkError = (error) =>
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


// 빵집이 DB에 있는지 확인하고, 없으면 서버 함수(register-bakery)로 등록해요 (카카오로 실제 존재를 확인한 뒤에만 등록돼요).
// input: { bakeryId, bakeryName, districtId, bakeryLat, bakeryLng, bakeryAddress }
export const ensureBakeryRegistered = async (client, input) => {
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
  if (status === 429) throw new RepositoryError('RATE_LIMITED', '빵집 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요. (저장되지 않았어요)')
  if (status === 400 || status === 422) {
    throw new RepositoryError('BAKERY_REJECTED', detail?.error?.message || messages.BAKERY_REJECTED)
  }
  throw error
}

