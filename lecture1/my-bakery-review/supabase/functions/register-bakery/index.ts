// register-bakery — "유효한 빵집"을 DB(bakeries 표)에 등록하는 서버 함수예요 (Supabase Edge Function, Deno).
//
// 왜 필요한가: 리뷰 EXP는 "DB에 등록된 유효한 빵집"에만 주기로 했어요. bakeries 표는 클라이언트가 직접 쓸 수 없고,
// 이 함수가 서버 비밀 키로만 씁니다. 등록하기 전에 카카오 로컬 API로 "그 ID의 제과·베이커리가 실제로 있는지" 확인해요.
//
// 요청(POST, 로그인한 사용자의 JWT 필요): { id, name, lat, lng }  (districtId를 보내도 무시해요)
// 응답: 200 { ok: true, registered: boolean } / 400 { error: { code, message } } / 401 / 502
//
// 필요한 설정 (Supabase 대시보드 → Edge Functions → Secrets):
//   KAKAO_REST_API_KEY   카카오 개발자 콘솔의 "REST API 키" (JavaScript 키와 다른 키예요. 프런트 · .env에는 넣지 않아요)
// 자동으로 들어오는 값: SUPABASE_URL, 서버 비밀 키(SUPABASE_SECRET_KEYS 또는 SUPABASE_SERVICE_ROLE_KEY)
//
// 보안 (Verify JWT를 꺼도 안전한 이유): 이 함수는 플랫폼의 JWT 검사에 기대지 않고 스스로 확인해요.
//  1) Authorization의 토큰을 Supabase Auth 서버에 보내 "진짜 로그인한 사용자인지" 확인해요 (auth.getUser = 서명 · 만료 · 로그아웃 여부 확인).
//     토큰이 없거나, publishable/anon 키처럼 사용자가 없는 토큰이거나, 위조 · 만료된 토큰이면 401이에요. 확인 서버에 문제가 있어도 "열어 주지 않아요"(실패 시 차단).
//  2) 이메일 인증을 마치지 않은 사용자는 403이에요.
//  3) 카카오 호출은 사용자당 호출 수를 제한해요(429). 이미 등록된 빵집은 카카오를 부르지 않아요.
//  4) 요청 크기 제한, 입력 검증, 이름 · 좌표 · 지역은 카카오가 알려준 값으로만 저장해요. 서버 비밀 키 · 카카오 키는 응답 · 로그에 쓰지 않아요.
//
// 이 파일 하나로 배포할 수 있어요 (대시보드 편집기에 붙여넣기). 판단 로직은 아래 export 함수들이고,
// supabase/tests/register-bakery.test.mjs가 Node로 검증해요.

// deno-lint-ignore-file no-explicit-any
declare const Deno: any

export const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  haeundae: { lat: 35.1631, lng: 129.1639 },
  seomyeon: { lat: 35.1579, lng: 129.0594 },
  nampodong: { lat: 35.0976, lng: 129.0285 },
  gwangalli: { lat: 35.1532, lng: 129.1186 },
  dongnae: { lat: 35.2054, lng: 129.0787 },
}
// 지역(district)은 클라이언트가 말한 값이 아니라, 카카오가 확인해 준 좌표에서 가장 가까운 지역 중심으로 서버가 정해요.
// ("지역 3곳 탐험" 퀘스트를 가짜 지역 값으로 채우지 못하게.) 모든 중심에서 이 거리보다 멀면 부산 밖으로 보고 거절해요.
export const MAX_DISTRICT_DISTANCE_KM = 25
export const KAKAO_SEARCH_RADIUS_M = 300

export type BakeryInput = { id: string; name: string; lat: number; lng: number }

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
  })
const rejection = (status: number, code: string, message: string) => json(status, { error: { code, message } })

// 요청 내용 검사 (타입 · 길이 · 값의 범위)
export const validateInput = (body: any): { ok: true; value: BakeryInput } | { ok: false; message: string } => {
  if (!body || typeof body !== 'object') return { ok: false, message: '요청 내용이 올바르지 않아요.' }
  const id = typeof body.id === 'string' ? body.id.trim() : String(body.id ?? '').trim()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!/^\d{3,20}$/.test(id)) return { ok: false, message: '빵집 ID 형식이 올바르지 않아요.' }
  if (name.length < 1 || name.length > 100) return { ok: false, message: '빵집 이름이 올바르지 않아요.' }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
    return { ok: false, message: '빵집 위치가 올바르지 않아요.' }
  }
  return { ok: true, value: { id, name, lat, lng } }
}

export const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

// 좌표에서 가장 가까운 지역 (너무 멀면 null = 부산 밖)
export const resolveDistrict = (lat: number, lng: number): string | null => {
  let best: string | null = null
  let bestDistance = Infinity
  for (const [id, center] of Object.entries(DISTRICT_CENTERS)) {
    const distance = distanceKm(lat, lng, center.lat, center.lng)
    if (distance < bestDistance) {
      best = id
      bestDistance = distance
    }
  }
  return bestDistance <= MAX_DISTRICT_DISTANCE_KM ? best : null
}

// 카카오 검색 결과 중 "같은 ID의 제과 · 베이커리"를 찾아요
export const findBakeryDocument = (documents: any[], id: string) =>
  (documents ?? []).find((doc) => String(doc.id) === id && /제과|베이커리/.test(String(doc.category_name ?? ''))) ?? null

export type Deps = {
  getUser: (jwt: string) => Promise<{ id: string; emailConfirmed: boolean } | null>
  hasBakery: (id: string) => Promise<boolean>
  upsertBakery: (row: { id: string; name: string; district_id: string; address: string | null; lat: number; lng: number }) => Promise<void>
  searchKakao: (name: string, lat: number, lng: number) => Promise<any[]>
  // 새 빵집을 확인하려고 카카오를 부르기 전에 확인해요 (사용자당 호출 수 제한). 없으면 제한하지 않아요.
  allowLookup?: (userId: string) => boolean
  // 서버 로그(Edge Functions → Logs)에만 남기는 함수예요. 응답에는 절대 담지 않아요. step = 실패한 단계, detail = 오류 종류 · 짧은 메시지
  log?: (step: string, detail: string) => void
}

export const MAX_BODY_BYTES = 4096

// 단순한 호출 제한기: key(사용자)마다 windowMs 동안 limit번까지. (함수 실행 환경 하나 안에서만 세는 "최선의 노력" 제한이에요.)
export const createRateLimiter = (limit: number, windowMs: number, now: () => number = () => Date.now()) => {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const t = now()
    const recent = (hits.get(key) ?? []).filter((time) => t - time < windowMs)
    if (recent.length >= limit) {
      hits.set(key, recent)
      return false
    }
    recent.push(t)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear() // 메모리가 무한히 커지지 않게
    return true
  }
}

// 서버 로그용 한 줄 설명: 오류 이름 · 코드 · 짧은 메시지만 (헤더 · 키 · 토큰은 오류 객체에 없지만, 길이를 제한해서 혹시 모를 노출도 줄여요)
const describe = (error: unknown) => {
  const e: any = error
  return `${e?.name ?? 'Error'}${e?.code ? ' code=' + e.code : ''}: ${String(e?.message ?? e).slice(0, 200)}`
}
const safeLog = (deps: Deps, step: string, error: unknown) => {
  try {
    deps.log?.(step, describe(error))
  } catch {
    // 로그를 못 남겨도 요청 처리에는 영향을 주지 않아요
  }
}

export const handleRequest = async (req: Request, deps: Deps): Promise<Response> => {
  const trace = { step: 'start' } // 지금 어느 단계인지 (오류가 났을 때 서버 로그에 남겨요)
  try {
    return await processRequest(req, deps, trace)
  } catch (error) {
    safeLog(deps, trace.step, error)
    // DB 권한 부족(42501)은 서버 설정 문제라서 따로 알려요. 내용(표 이름 · 힌트)은 숨기고 종류만 돌려줘요.
    if ((error as any)?.code === '42501') {
      return rejection(500, 'DB_PERMISSION', '서버의 데이터베이스 권한 설정이 끝나지 않았어요. 서버 관리자가 필요해요.')
    }
    // 그 밖의 예상하지 못한 오류는 자세한 내용을 숨기고, 브라우저가 읽을 수 있게 CORS가 붙은 500으로 돌려줘요
    return rejection(500, 'INTERNAL', '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
  }
}

const processRequest = async (req: Request, deps: Deps, trace: { step: string }): Promise<Response> => {
  if (req.method === 'OPTIONS') return json(200, { ok: true })
  if (req.method !== 'POST') return rejection(405, 'METHOD_NOT_ALLOWED', 'POST만 쓸 수 있어요.')

  trace.step = 'auth'
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const user = jwt ? await deps.getUser(jwt).catch(() => null) : null
  if (!user) return rejection(401, 'NOT_SIGNED_IN', '로그인이 필요해요.')
  if (!user.emailConfirmed) return rejection(403, 'EMAIL_NOT_VERIFIED', '이메일 인증을 마친 뒤에 쓸 수 있어요.')

  trace.step = 'read-body'
  let body: any
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return rejection(413, 'TOO_LARGE', '요청이 너무 커요.')
    body = JSON.parse(raw)
  } catch {
    return rejection(400, 'INVALID_INPUT', '요청 내용이 올바르지 않아요.')
  }
  const input = validateInput(body)
  if (!input.ok) return rejection(400, 'INVALID_INPUT', input.message)
  const bakery = input.value

  // 이미 등록돼 있으면 카카오를 다시 부르지 않아요 (호출 수를 아끼고 남용을 줄여요)
  trace.step = 'lookup-bakery'
  if (await deps.hasBakery(bakery.id)) return json(200, { ok: true, registered: false })

  if (deps.allowLookup && !deps.allowLookup(user.id)) {
    return rejection(429, 'RATE_LIMITED', '빵집 확인 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.')
  }

  trace.step = 'kakao'
  let documents: any[]
  try {
    documents = await deps.searchKakao(bakery.name, bakery.lat, bakery.lng)
  } catch (error) {
    safeLog(deps, 'kakao', error)
    return rejection(502, 'KAKAO_UNAVAILABLE', '빵집 확인 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  const match = findBakeryDocument(documents, bakery.id)
  if (!match) return rejection(400, 'BAKERY_NOT_FOUND', '실제 제과 · 베이커리로 확인되지 않았어요.')

  // 이름 · 주소 · 좌표 · 지역은 클라이언트가 보낸 값이 아니라 카카오가 알려준 값으로 정해서 저장해요
  const lat = Number(match.y)
  const lng = Number(match.x)
  const districtId = Number.isFinite(lat) && Number.isFinite(lng) ? resolveDistrict(lat, lng) : null
  if (!districtId) return rejection(400, 'OUT_OF_AREA', '부산 지역의 빵집만 등록할 수 있어요.')
  trace.step = 'save-bakery'
  await deps.upsertBakery({
    id: bakery.id,
    name: String(match.place_name).slice(0, 100),
    district_id: districtId,
    address: String(match.road_address_name || match.address_name || '').slice(0, 200) || null,
    lat,
    lng,
  })
  return json(200, { ok: true, registered: true })
}

// ── Edge Function 실행부 (Deno에서만 동작해요. 테스트에서는 위의 handleRequest만 불러요) ──
const startServer = () => {
  // 사용자당 10분에 새 빵집 확인 20번까지 (일반 사용에는 충분하고, 무차별 요청은 막아요)
  const allowLookup = createRateLimiter(20, 10 * 60 * 1000)
  const handler = async (req: Request) => {
    // npm: 가져오기는 Deno 전용이라 여기서만 불러와요
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const url = Deno.env.get('SUPABASE_URL')
    let secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    try {
      const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
      secretKey = keys.default ?? Object.values(keys)[0] ?? secretKey
    } catch {
      // 새 키 형식이 없으면 기존 변수를 써요
    }
    const kakaoKey = Deno.env.get('KAKAO_REST_API_KEY')
    if (!url || !secretKey || !kakaoKey) return rejection(500, 'NOT_CONFIGURED', '서버 설정이 끝나지 않았어요. (KAKAO_REST_API_KEY 등)')

    const admin = createClient(url, secretKey, { auth: { persistSession: false } })
    return handleRequest(req, {
      allowLookup,
      log: (step, detail) => console.error(`[register-bakery] 실패 단계=${step} ${detail}`),
      getUser: async (jwt) => {
        const { data, error } = await admin.auth.getUser(jwt)
        if (error || !data.user) return null
        return { id: data.user.id, emailConfirmed: Boolean(data.user.email_confirmed_at) }
      },
      hasBakery: async (id) => {
        const { data, error } = await admin.from('bakeries').select('id').eq('id', id).maybeSingle()
        if (error) throw error
        return Boolean(data)
      },
      upsertBakery: async (row) => {
        const { error } = await admin.from('bakeries').upsert(row, { onConflict: 'id' })
        if (error) throw error
      },
      searchKakao: async (name, lat, lng) => {
        const params = new URLSearchParams({ query: name, x: String(lng), y: String(lat), radius: String(KAKAO_SEARCH_RADIUS_M), size: '15' })
        const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, { headers: { Authorization: `KakaoAK ${kakaoKey}` } })
        if (!res.ok) throw new Error(`kakao ${res.status}`)
        return (await res.json()).documents ?? []
      },
    })
  }
  Deno.serve(handler)
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') startServer()
