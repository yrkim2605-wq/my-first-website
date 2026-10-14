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
  FUNCTION_MISSING: '지금은 빵집을 확인하는 기능을 쓸 수 없어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_NOT_CONFIGURED: '빵집 확인 기능을 준비하는 중이에요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  KAKAO_UNAVAILABLE: '카카오의 빵집 확인 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_DB_PERMISSION: '서비스 설정에 문제가 있어서 지금은 빵집을 등록하지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_ERROR: '빵집 확인 서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요. (저장되지 않았어요)',
  FUNCTION_UNREACHABLE: '빵집 확인 서버에 연결하지 못했어요. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_NETWORK_BLOCKED:
    '이 브라우저에서 서버(Supabase)에 연결되지 않아요. 인터넷 연결, VPN, 광고 · 보안 차단 확장 프로그램을 확인한 뒤 다시 시도해 주세요. 시크릿 창에서 확장 프로그램 없이 시도해 보는 것도 좋아요. (저장되지 않았어요)',
  FUNCTION_REQUEST_BLOCKED: '빵집 확인 서버는 응답하는데, 로그인 정보가 담긴 요청이 서버에 닿기 전에 막혔어요. 로그아웃했다가 다시 로그인한 뒤 시도해 보세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_HEADERS_BLOCKED:
    '이 브라우저가 로그인 정보(인증 헤더)가 담긴 요청을 막았어요. 보안 프로그램 · 확장 프로그램 · 회사/학교 네트워크를 확인하거나, 시크릿 창이나 다른 네트워크(휴대폰 핫스팟)에서 시도해 보세요. (저장되지 않았어요)',
  FUNCTION_TOKEN_BLOCKED: '로그인 정보가 담긴 요청이 막혀요. 로그아웃했다가 다시 로그인한 뒤 시도해 보세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_AUTH_NO_RESPONSE: '서버가 로그인 정보를 확인하는 단계에서 응답하지 못해요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_PROCESS_FAILED: '서버가 빵집을 확인하고 등록하는 중에 응답이 끊겼어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_NO_RESPONSE: '서버가 요청을 처리하다가 응답하지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  FUNCTION_TIMEOUT: '빵집 확인 서버의 응답이 너무 늦어요(25초). 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  TOO_LARGE: '요청이 너무 커서 처리하지 못했어요. (저장되지 않았어요)',
  RATE_LIMITED: '빵집 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요. (저장되지 않았어요)',
  BAKERY_REJECTED: '이 빵집은 확인하지 못했어요. 지도에서 다시 골라 주세요.',
  FORBIDDEN_SAVE: '저장할 권한이 없어요. 로그인 상태와 이메일 인증을 확인한 뒤 다시 시도해 주세요. 계속되면 서버 권한 설정 문제일 수 있어요. (저장되지 않았어요)',
  SCHEMA_MISMATCH: '서비스 설정에 문제가 있어서 지금은 저장하지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 문의처로 알려 주세요. (저장되지 않았어요)',
  UNKNOWN: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  NOT_FOUND: '일지를 찾을 수 없어요. (이미 지워졌거나 내가 쓴 일지가 아니에요)',
}

// 사용자에게는 쉬운 안내만 보여주고, 원인을 찾는 데 필요한 기술 안내는 여기에 둬요.
// 화면에는 나오지 않아요. 오류 객체의 debug.operatorHint와 개발 환경(npm run dev) 콘솔에서만 볼 수 있어요.
export const operatorHints = {
  FUNCTION_MISSING: 'Edge Function register-bakery가 배포되지 않았어요 (404).',
  FUNCTION_NOT_CONFIGURED: 'Edge Function 시크릿 KAKAO_REST_API_KEY를 설정해야 해요.',
  KAKAO_UNAVAILABLE: '카카오 REST API 키와 카카오맵 사용 설정(쿼터 포함)을 확인해야 해요.',
  FUNCTION_DB_PERMISSION: '마이그레이션 0007_service_role_grants.sql을 적용해야 해요 (service_role 권한 부족, 42501).',
  FUNCTION_UNREACHABLE: 'register-bakery 함수의 배포 · 접근 설정을 확인해야 해요.',
  FUNCTION_REQUEST_BLOCKED: '함수의 접근(CORS) · 로그인 검사 설정을 확인해야 해요.',
  FUNCTION_TOKEN_BLOCKED: '함수의 Verify JWT · 로그인 키(JWT 서명 방식) 설정을 확인해야 해요.',
  FUNCTION_AUTH_NO_RESPONSE: 'Edge Functions Logs와 함수의 서버 비밀 키 설정을 확인해야 해요.',
  FUNCTION_PROCESS_FAILED: 'Edge Functions → register-bakery → Logs에서 오류를 확인해야 해요 (카카오 확인 · DB 등록 중 끊김).',
  FUNCTION_NO_RESPONSE: 'Supabase → Edge Functions → register-bakery의 Logs(호출 기록)를 확인해야 해요.',
  FUNCTION_TIMEOUT: '카카오 연결 상태와 Edge Functions Logs를 확인해야 해요.',
  SCHEMA_MISMATCH: '마이그레이션 0001~0010이 모두 적용됐는지 확인해야 해요.',
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

const describeCause = (error) => {
  const inner = error?.cause ?? (error?.context instanceof Error ? error.context : null)
  return inner ? `${inner.name ?? 'Error'}: ${String(inner.message ?? '').slice(0, 200)}` : null
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
  // 연결 오류는 겉 메시지("Failed to send a request…") 뒤에 진짜 원인(TypeError: Failed to fetch 등)이 숨어 있어요
  cause: describeCause(error),
})

const fail = (code, message, debug) => {
  const result = new RepositoryError(code, message)
  result.debug = { ...debug, operatorHint: operatorHints[code] ?? null }
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
export const mapFunctionError = (error, status, detail, probe, elapsedMs) => {
  const serverCode = detail?.error?.code ?? null
  const debug = {
    ...describeError(error, 'register', 'function'),
    status: status ?? null,
    probe: probe?.note ?? null,
    elapsedMs: elapsedMs ?? null,
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
  if (serverCode === 'DB_PERMISSION') return fail('FUNCTION_DB_PERMISSION', messages.FUNCTION_DB_PERMISSION, debug)
  if (serverCode === 'NOT_CONFIGURED') return fail('FUNCTION_NOT_CONFIGURED', messages.FUNCTION_NOT_CONFIGURED, debug)
  if (status && status >= 500) return fail('FUNCTION_ERROR', `${messages.FUNCTION_ERROR} (오류 코드: register/${status}${serverCode ? '/' + serverCode : ''})`, debug)
  // 상태가 없다 = 요청이 서버에 닿기 전에 실패했어요. 로그인 정보 없이 보낸 단순 요청(probe)으로 원인을 가려요.
  //  - 단순 요청도 실패 → 이 브라우저가 서버에 못 닿아요 (인터넷 · VPN · 차단 확장 프로그램)
  //  - 단순 요청은 응답 → 서버는 살아 있고, 로그인 정보가 담긴 요청만 막혔어요 (CORS · 로그인 검사 설정 · 토큰 문제)
  //  - 요청 시간 제한(25초)에 걸렸다면 응답이 너무 늦은 거예요
  //  - 인증 헤더가 있는 요청(CORS 사전 확인이 필요한 요청)은 막히는지, 아니면 서버가 로그인 사용자의 요청을 처리하다 응답을 못 줬는지 가려요
  if (error?.context?.name === 'AbortError' || error?.cause?.name === 'AbortError') return fail('FUNCTION_TIMEOUT', messages.FUNCTION_TIMEOUT, debug)
  if (probe?.reachable === false) return fail('FUNCTION_NETWORK_BLOCKED', messages.FUNCTION_NETWORK_BLOCKED, debug)
  // 실제 로그인 토큰으로 "어디까지 가는지" 잰 결과가 있으면 가장 정확해요 (probe의 3 · 4단계)
  if (probe?.reachable === true && probe.tokenGetOk === false) return fail('FUNCTION_TOKEN_BLOCKED', messages.FUNCTION_TOKEN_BLOCKED, debug)
  if (probe?.reachable === true && probe.tokenGetOk === true && probe.tokenPostOk === false) return fail('FUNCTION_AUTH_NO_RESPONSE', messages.FUNCTION_AUTH_NO_RESPONSE, debug)
  if (probe?.reachable === true && probe.tokenPostOk === true) return fail('FUNCTION_PROCESS_FAILED', messages.FUNCTION_PROCESS_FAILED, debug)
  if (probe?.reachable === true && probe.headersOk === false) return fail('FUNCTION_HEADERS_BLOCKED', messages.FUNCTION_HEADERS_BLOCKED, debug)
  if (probe?.reachable === true && probe.headersOk === true) return fail('FUNCTION_NO_RESPONSE', messages.FUNCTION_NO_RESPONSE, debug)
  if (probe?.reachable === true) return fail('FUNCTION_REQUEST_BLOCKED', messages.FUNCTION_REQUEST_BLOCKED, debug)
  return fail('FUNCTION_UNREACHABLE', messages.FUNCTION_UNREACHABLE, debug)
}

// 로그인 토큰(JWT)의 "종류와 남은 시간"만 읽어요. 토큰 값 자체는 어디에도 남기지 않아요.
const decodeBase64Url = (part) => {
  let text = part.split('-').join('+').split('_').join('/')
  while (text.length % 4 !== 0) text += '='
  return JSON.parse(atob(text))
}
export const describeToken = (token) => {
  try {
    const [headerPart, payloadPart] = String(token).split('.')
    const header = decodeBase64Url(headerPart)
    const payload = decodeBase64Url(payloadPart)
    const secondsLeft = typeof payload.exp === 'number' ? Math.round(payload.exp - Date.now() / 1000) : null
    return `토큰 알고리즘=${header.alg} 역할=${payload.role ?? '없음'} 만료까지=${secondsLeft === null ? '알 수 없음' : secondsLeft + '초'}`
  } catch {
    return '토큰 형식을 읽지 못함'
  }
}

// 3 · 4단계: 실제 로그인 토큰으로 어디까지 가는지 재요. 둘 다 데이터를 바꾸지 않아요.
//  3) GET  → 함수는 인증 확인 "전에" 405로 끝내요 (게이트웨이 · 사전 요청(CORS) · 토큰 통과 여부만 확인)
//  4) POST {} → 로그인 확인과 본문 읽기까지 간 뒤, 입력 검증에서 400으로 끝내요 (빵집 조회 · 카카오 · DB 등록 전 단계)
const probeWithUserToken = async (client, url, publicKey, baseNote, signal) => {
  const token = await client.auth
    ?.getSession?.()
    .then((session) => session?.data?.session?.access_token ?? null)
    .catch(() => null)
  if (!token) return { reachable: true, headersOk: true, note: `${baseNote} / 로그인 토큰을 찾지 못함` }
  const headers = { apikey: publicKey, Authorization: `Bearer ${token}` }
  const notes = [baseNote, describeToken(token)]
  let tokenGetOk
  let tokenPostOk
  try {
    const response = await fetch(url, { method: 'GET', headers, signal })
    tokenGetOk = true
    notes.push(`토큰 GET→HTTP ${response.status}`)
  } catch (getError) {
    tokenGetOk = false
    notes.push(`토큰 GET 실패(${getError?.name}: ${String(getError?.message ?? '').slice(0, 80)})`)
  }
  if (tokenGetOk) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}', signal })
      tokenPostOk = true
      notes.push(`토큰 POST{}→HTTP ${response.status}`)
    } catch (postError) {
      tokenPostOk = false
      notes.push(`토큰 POST{} 실패(${postError?.name}: ${String(postError?.message ?? '').slice(0, 80)})`)
    }
  }
  return { reachable: true, headersOk: true, tokenGetOk, tokenPostOk, note: notes.join(' / ') }
}

// 서버 함수에 닿는지 확인하는 가벼운 진단 (연결 오류가 났을 때만 써요).
// 로그인 정보 · 특별한 헤더가 없는 단순 POST라서 사전 요청(CORS preflight) 없이 가요. 함수는 로그인이 없다고 401로 답해요(아무것도 바뀌지 않아요).
export const probeFunctionServer = async (client) => {
  const base = client?.functionsUrl?.href
  if (!base || typeof fetch !== 'function') return { reachable: null, note: '확인하지 못함' }
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), 4000) : null
  try {
    const root = base.endsWith('/') ? base.slice(0, -1) : base
    const url = `${root}/register-bakery`
    let simpleNote
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}', signal: controller?.signal })
      simpleNote = `단순 요청은 응답함(HTTP ${response.status})`
    } catch (probeError) {
      return { reachable: false, note: `단순 요청도 실패(${probeError?.name}: ${String(probeError?.message ?? '').slice(0, 100)})` }
    }
    // 2단계: 앱이 실제로 보내는 것과 같은 모양의 요청(인증 헤더 + JSON → 브라우저가 사전 확인(CORS preflight)을 먼저 보내요).
    // 로그인 토큰 대신 공개 가능한 publishable 키를 넣어요 → 함수는 "로그인 필요"(401)로 답하고 아무것도 바뀌지 않아요.
    const publicKey = client?.supabaseKey
    if (!publicKey) return { reachable: true, note: simpleNote }
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: publicKey, Authorization: `Bearer ${publicKey}` },
        body: '{}',
        signal: controller?.signal,
      })
      const headerNote = `${simpleNote} / 인증 헤더 요청도 응답함(HTTP ${response.status})`
      return await probeWithUserToken(client, url, publicKey, headerNote, controller?.signal)
    } catch (headerError) {
      return { reachable: true, headersOk: false, note: `${simpleNote} / 인증 헤더 요청은 실패(${headerError?.name}: ${String(headerError?.message ?? '').slice(0, 100)})` }
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// 빵집이 DB에 있는지 확인하고, 없으면 서버 함수(register-bakery)로 등록해요 (카카오로 실제 존재를 확인한 뒤에만 등록돼요).
// input: { bakeryId, bakeryName, districtId, bakeryLat, bakeryLng, bakeryAddress }
export const ensureBakeryRegistered = async (client, input) => {
  const { data: existing, error: lookupError } = await client.from('bakeries').select('id').eq('id', input.bakeryId).maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return
  const startedAt = Date.now()
  const { error } = await client.functions.invoke('register-bakery', {
    // 서버가 25초 안에 답하지 않으면 끊고 "너무 늦어요" 안내를 보여줘요 (끝없이 기다리지 않게)
    timeout: 25000,
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
  const probe = status ? null : await probeFunctionServer(client)
  throw mapFunctionError(error, status, detail, probe, Date.now() - startedAt)
}
