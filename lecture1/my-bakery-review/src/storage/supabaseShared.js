import { RepositoryError } from './localStore'
import { AUTH_NETWORK_MESSAGE } from './authMessages'

// Supabase 저장소들(리뷰 · 방문 체크)이 같이 쓰는 도우미예요: 오류 → 한국어 안내, 빵집 DB 등록 확인.
//
// 저장이 실패했을 때 "어디서 · 왜" 실패했는지 알 수 있게 해요.
//  - 화면에는 원인별 한국어 안내를 보여줘요 (알 수 없는 오류만 "저장하지 못했어요 + 오류 코드"로 보여줘요).
//  - 개발 환경(npm run dev)에서는 브라우저 콘솔(F12)에 단계 · 상태 · 오류 코드 · 메시지를 출력해요. (배포본에서는 출력하지 않아요)
//  - 오류 객체의 debug 칸에도 같은 정보가 들어 있어요 (개발 환경 화면의 오류 상자에 작게 보여줘요).
//  - 서버 비밀 키 · 로그인 토큰은 어디에도 출력하지 않아요.

export const messages = {
  NOT_SIGNED_IN: '로그인이 필요해요. 이메일로 로그인한 뒤 다시 시도해 주세요.',
  SESSION_EXPIRED: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  DUPLICATE_REVIEW: '이미 이 빵집에 기록을 남겼어요. 기록을 고쳐 쓸 수 있어요.',
  INVALID_BAKERY: '아직 등록되지 않은 빵집이라 저장할 수 없어요. 잠시 후 다시 시도해 주세요.',
  SAMPLE_BAKERY: '예시 빵집에는 일지를 저장할 수 없어요. 지도에서 실제 빵집을 골라 주세요.',
  DAILY_REVIEW_LIMIT: '오늘은 일지를 너무 많이 썼어요 (하루 20개까지). 내일 다시 써 주세요.',
  EMAIL_NOT_CONFIRMED: '이메일 인증을 마친 뒤에 쓸 수 있어요.',
  INVALID_INPUT: '별점과 내용을 다시 확인해 주세요 (내용은 공백을 뺀 20자 이상, 500자 이하).',
  CONTENT_TOO_SHORT: '내용이 너무 짧아요. 공백을 뺀 글자 수로 20자 이상 써 주세요. (저장되지 않았어요)',
  CONTENT_TOO_LONG: '내용이 너무 길어요. 500자 이하로 줄여 주세요. (저장되지 않았어요)',
  PHOTO_FAILED: '사진을 올리지 못했어요. 사진을 빼거나 다른 사진으로 다시 시도해 주세요. (저장되지 않았어요)',
  FUNCTION_MISSING: '빵집 확인 기능이 아직 설정되지 않았어요. 관리자(서버 설정)가 필요해요. (저장되지 않았어요)',
  FUNCTION_NOT_CONFIGURED: '빵집 확인 서버의 설정이 끝나지 않았어요. 서버 관리자가 KAKAO_REST_API_KEY를 설정해야 해요. (저장되지 않았어요)',
  KAKAO_UNAVAILABLE:
    '카카오의 빵집 확인 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 서버 관리자가 카카오 REST API 키와 사용 설정을 확인해야 해요. (저장되지 않았어요)',
  FUNCTION_ERROR: '빵집 확인 서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요. (저장되지 않았어요)',
  FUNCTION_UNREACHABLE:
    '빵집 확인 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요. 계속되면 서버 관리자가 빵집 확인 함수의 배포 · 접근 설정을 확인해야 해요. (저장되지 않았어요)',
  TOO_LARGE: '요청이 너무 커서 처리하지 못했어요. (저장되지 않았어요)',
  RATE_LIMITED: '빵집 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요. (저장되지 않았어요)',
  BAKERY_REJECTED: '이 빵집은 확인하지 못했어요. 지도에서 다시 골라 주세요.',
  FORBIDDEN_SAVE: '저장할 권한이 없어요. 로그인 상태와 이메일 인증을 확인한 뒤 다시 시도해 주세요. 계속되면 서버 권한 설정 문제일 수 있어요. (저장되지 않았어요)',
  SCHEMA_MISMATCH:
    '서버 데이터베이스 설정이 앱과 맞지 않아요. 서버 관리자가 마이그레이션(0001~0006)이 모두 적용됐는지 확인해야 해요. (저장되지 않았어요)',
  UNKNOWN: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  NOT_FOUND: '일지를 찾을 수 없어요. (이미 지워졌거나 내가 쓴 일지가 아니에요)',
}

export const isNetworkError = (error) =>
  error?.name === 'AuthRetryableFetchError' ||
  error instanceof TypeError ||
  /failed to fetch|networkerror|load failed|network request failed/i.test(String(error?.message ?? ''))

// ── 개발용 오류 출력 ──
// 기본은 "개발 환경(npm run dev)에서만 콘솔에 출력". 테스트에서는 setDebugLogger로 바꿔서 내용을 확인해요.
let debugLogger = (info) => {
  if (import.meta.env?.DEV) console.error('[빵덕후 저장 오류]', info)
}
export const setDebugLogger = (logger) => {
  debugLogger = logger
}

// 오류에서 원인을 찾을 수 있는 정보만 뽑아요 (토큰 · 키는 포함하지 않아요)
export const describeError = (error, step, source = 'database') => ({
  step: step ?? 'unknown',
  source,
  name: error?.name ?? null,
  code: error?.code ?? null,
  status: error?.status ?? error?.context?.status ?? null,
  message: String(error?.message ?? '').slice(0, 300),
  details: error?.details ? String(error.details).slice(0, 300) : null,
  hint: error?.hint ? String(error.hint).slice(0, 300) : null,
})

const fail = (code, message, debug) => {
  const result = new RepositoryError(code, message)
  result.debug = debug
  debugLogger({ ...debug, userMessage: message, userCode: code })
  return result
}

// 짧은 오류 코드 (알 수 없는 오류일 때 화면에 같이 보여줘서 나중에 원인을 찾기 쉽게 해요)
const shortCode = (debug) => [debug.step, debug.status, debug.code].filter((part) => part !== null && part !== undefined && part !== '').join('/') || 'unknown'

// Supabase / 저장소 오류 → 사용자에게 보여줄 한국어 안내
// step: 어느 단계에서 났는지 ('register' 빵집 확인 · 'photo' 사진 · 'insert' 일지 저장 · 'update' 고치기 · 'delete' 지우기 · 'read' 불러오기)
export const toReviewError = (error, step) => {
  if (error instanceof RepositoryError) return error // 이미 안내문으로 바뀐 오류 (예: 빵집 확인 함수 오류)
  const debug = describeError(error, step)
  const text = String(error?.message ?? '')
  const code = error?.code

  if (isNetworkError(error)) return fail('NETWORK', AUTH_NETWORK_MESSAGE, debug)
  if (code === '23505') return fail('DUPLICATE_REVIEW', messages.DUPLICATE_REVIEW, debug)
  if (code === '23503') return fail('INVALID_BAKERY', messages.INVALID_BAKERY, debug)
  // 서버의 글자 수 검사(0006)가 거절했을 때 (화면 검사를 우회한 경우에도 안내가 나와요)
  if (/REVIEW_TOO_SHORT/.test(text)) return fail('CONTENT_TOO_SHORT', messages.CONTENT_TOO_SHORT, debug)
  if (/REVIEW_TOO_LONG/.test(text)) return fail('CONTENT_TOO_LONG', messages.CONTENT_TOO_LONG, debug)
  if (code === '23514') return fail('INVALID_INPUT', messages.INVALID_INPUT, debug)
  if (/DAILY_REVIEW_LIMIT/.test(text)) return fail('DAILY_REVIEW_LIMIT', messages.DAILY_REVIEW_LIMIT, debug)
  if (/EMAIL_NOT_VERIFIED/.test(text)) return fail('EMAIL_NOT_CONFIRMED', messages.EMAIL_NOT_CONFIRMED, debug)
  if (/NOT_SIGNED_IN|jwt expired|invalid jwt/i.test(text) || code === 'PGRST301' || code === '28000') {
    return fail('SESSION_EXPIRED', messages.SESSION_EXPIRED, debug)
  }
  if (code === '42501' || /row-level security|permission denied/i.test(text)) {
    // 저장 중의 권한 오류는 "내 일지만 고칠 수 있어요"가 아니라 저장 권한 안내가 맞아요
    const isSaving = step === 'insert' || step === 'photo'
    return fail('FORBIDDEN', isSaving ? messages.FORBIDDEN_SAVE : '이 작업을 할 권한이 없어요. 내가 쓴 일지만 고치거나 지울 수 있어요.', debug)
  }
  // 서버 표 · 칸이 앱 코드와 맞지 않을 때 (마이그레이션 누락 등)
  if (['PGRST200', 'PGRST204', 'PGRST205', '42703', '42P01', '42883'].includes(code)) return fail('SCHEMA_MISMATCH', messages.SCHEMA_MISMATCH, debug)
  if (['22P02', '23502', '22003', '22001'].includes(code)) return fail('INVALID_INPUT', messages.INVALID_INPUT, debug)

  return fail('UNKNOWN', `${messages.UNKNOWN} (오류 코드: ${shortCode(debug)})`, debug)
}

// 빵집 확인 서버 함수(register-bakery)의 오류 → 원인별 안내
//  status: HTTP 상태 (연결 자체가 안 되면 undefined) / detail: 함수가 돌려준 { error: { code, message } }
export const mapFunctionError = (error, status, detail) => {
  const serverCode = detail?.error?.code ?? null
  const debug = {
    ...describeError(error, 'register', 'function'),
    status: status ?? null,
    serverCode,
    serverMessage: detail?.error?.message ? String(detail.error.message).slice(0, 200) : null,
  }
  if (status === 404) return fail('FUNCTION_MISSING', messages.FUNCTION_MISSING, debug)
  if (status === 401) return fail('SESSION_EXPIRED', messages.SESSION_EXPIRED, debug)
  if (status === 403) return fail('EMAIL_NOT_CONFIRMED', messages.EMAIL_NOT_CONFIRMED, debug)
  if (status === 413) return fail('TOO_LARGE', messages.TOO_LARGE, debug)
  if (status === 429) return fail('RATE_LIMITED', messages.RATE_LIMITED, debug)
  if (status === 400 || status === 422) return fail('BAKERY_REJECTED', detail?.error?.message || messages.BAKERY_REJECTED, debug)
  if (status === 502 || serverCode === 'KAKAO_UNAVAILABLE') return fail('KAKAO_UNAVAILABLE', messages.KAKAO_UNAVAILABLE, debug)
  if (serverCode === 'NOT_CONFIGURED') return fail('FUNCTION_NOT_CONFIGURED', messages.FUNCTION_NOT_CONFIGURED, debug)
  if (status && status >= 500) return fail('FUNCTION_ERROR', `${messages.FUNCTION_ERROR} (오류 코드: register/${status}${serverCode ? '/' + serverCode : ''})`, debug)
  // 상태가 없다 = 서버에 닿지 못했어요 (인터넷 끊김 · 함수 미배포 · 접근 차단 등)
  return fail('FUNCTION_UNREACHABLE', messages.FUNCTION_UNREACHABLE, debug)
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
  throw mapFunctionError(error, error.context?.status, detail)
}
