// delete-account — 로그인한 사용자가 "자기 계정"을 직접 지우는 서버 함수예요 (Supabase Edge Function, Deno).
//
// 왜 필요한가: 브라우저(publishable 키)는 계정(auth.users)을 지울 권한이 없어요. 서버 비밀 키를 가진 이 함수만 지울 수 있어요.
// DB의 프로필 · 리뷰 · 글 · 댓글 · 좋아요 · 방문 기록은 계정을 지우면 on delete cascade로 같이 지워져요 (0001_schema.sql).
// 하지만 사진 파일(Storage)은 연쇄로 지워지지 않아서, 이 함수가 먼저 지워요.
//
// 요청(POST, 로그인한 사용자의 JWT 필요): { confirm: true }   (지울 계정은 요청이 아니라 "토큰의 주인"으로만 정해요)
// 응답: 200 { ok: true } / 4xx · 5xx { error: { code, message } }
//
// 보안
//  1) Authorization의 토큰을 Supabase Auth 서버에 보내 진짜 로그인한 사용자인지 확인해요 (실패 시 차단).
//  2) 최근에 비밀번호로 다시 로그인한 세션만 허용해요: 토큰의 amr(인증 방법 기록)에서 가장 최근 인증이 10분 안이어야 해요.
//     (오래된 세션을 누가 가로채도 탈퇴시킬 수 없어요. 화면은 탈퇴 직전에 비밀번호를 다시 받아서 로그인해요.)
//  3) 대상은 토큰에서 읽은 사용자 id 하나뿐이에요. 요청에 다른 id를 실어도 쓰지 않아요.
//  4) 순서: 사진 파일 삭제 → 계정 삭제 → 마무리 청소(best effort). 사진 삭제가 실패하면 계정은 그대로 두고 알려요 (다시 시도할 수 있어요).
//     · 내 폴더({user_id}/) 아래를 하위 폴더까지 모두 찾고, 100개씩 지워요. 일부만 지워지면(오류 없이 개수가 모자라면) 실패로 봐요.
//     · 파일이 2,000개를 넘거나 폴더가 4단계보다 깊으면 안전을 위해 멈추고 실패로 알려요.
//     · 계정 삭제가 실패해도 사진 삭제는 다시 해도 안전해요. 계정 삭제 뒤의 마무리 청소가 실패해도 탈퇴는 성공이고, 서버 로그에만 남겨요.
//     · 사진을 먼저 지우는 이유: 계정을 먼저 지우면 주인 없는 파일은 아무도 지울 수 없고, 예전 Supabase 프로젝트는 파일이 남은 사용자를 못 지우기도 해요.
//  5) 안전장치: 토큰 모양이 아니면 인증 서버에 묻지 않고 거절해요. 인증 서버가 돌려준 id가 UUID가 아니면 아무것도 지우지 않아요.
//  6) 서버 로그에는 실패한 단계와 오류 종류만 남겨요. 토큰 · 키는 쓰지 않아요.
//
// 이 파일 하나로 배포할 수 있어요 (대시보드 편집기에 붙여넣기). 판단 로직은 handleRequest이고,
// supabase/tests/delete-account.test.mjs가 Node로 검증해요.

// deno-lint-ignore-file no-explicit-any
declare const Deno: any

export const REAUTH_WINDOW_SECONDS = 10 * 60
export const MAX_BODY_BYTES = 1024
const PHOTO_BUCKET = 'photos'
export const PHOTO_PAGE_SIZE = 100 // 목록 · 삭제를 100개씩 나눠서 해요
export const MAX_PHOTO_FILES = 2000 // 이 수를 넘으면 안전을 위해 멈춰요 (무한 반복 · 과도한 작업 방지)
export const MAX_FOLDER_DEPTH = 4 // 하위 폴더는 4단계까지만 따라가요

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// 로그인 토큰(JWT)의 겉모양: 점으로 이어진 3덩어리. 인증 서버에 묻기 전에 걸러서, 엉터리 요청이 인증 서버를 괴롭히지 않게 해요.
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/

// 저장소(Storage)의 한 버킷처럼 쓸 수 있는 것: list(경로, 옵션) / remove(경로들). 시험에서는 가짜를 넣어요.
export type PhotoBucket = {
  list: (path: string, options: { limit: number; offset: number }) => Promise<{ data: any[] | null; error: any }>
  remove: (paths: string[]) => Promise<{ data: any[] | null; error: any }>
}

// 내 폴더({user_id}/…) 아래의 파일을 모두 찾아요. 하위 폴더(id가 없는 항목)는 안으로 들어가서 찾고, 100개가 넘으면 다음 쪽도 읽어요.
export const collectPhotoPaths = async (bucket: PhotoBucket, userId: string): Promise<string[]> => {
  if (!UUID_PATTERN.test(userId)) throw new Error('invalid user id') // 빈 값이면 버킷 전체를 가리키게 되므로 반드시 막아요
  const files: string[] = []
  const walk = async (prefix: string, depth: number): Promise<void> => {
    if (depth > MAX_FOLDER_DEPTH) throw new Error('folder too deep')
    for (let offset = 0; ; offset += PHOTO_PAGE_SIZE) {
      const { data, error } = await bucket.list(prefix, { limit: PHOTO_PAGE_SIZE, offset })
      if (error) throw error
      const items = data ?? []
      for (const item of items) {
        if (!item?.name) continue
        const path = `${prefix}/${item.name}`
        if (item.id === null || item.id === undefined) await walk(path, depth + 1) // 폴더
        else files.push(path)
        if (files.length > MAX_PHOTO_FILES) throw new Error('too many photo files')
      }
      if (items.length < PHOTO_PAGE_SIZE) return
    }
  }
  await walk(userId, 0)
  return files
}

// 내 폴더의 사진을 모두 지워요. 일부만 지워졌거나 오류가 나면 던져요 (호출한 쪽이 "계정은 그대로"로 처리해요).
export const deleteUserPhotos = async (bucket: PhotoBucket, userId: string): Promise<void> => {
  const paths = await collectPhotoPaths(bucket, userId)
  for (let start = 0; start < paths.length; start += PHOTO_PAGE_SIZE) {
    const chunk = paths.slice(start, start + PHOTO_PAGE_SIZE)
    const { data, error } = await bucket.remove(chunk)
    if (error) throw error
    // 오류 없이 일부만 지워진 경우도 실패로 봐요 (남은 파일이 있는데 성공으로 끝내지 않아요)
    if (!Array.isArray(data) || data.length !== chunk.length) throw new Error(`partial photo removal ${Array.isArray(data) ? data.length : 0}/${chunk.length}`)
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
  })
const rejection = (status: number, code: string, message: string) => json(status, { error: { code, message } })

// 토큰(JWT)의 가운데 부분에서 amr(인증 방법 기록)을 읽어 "가장 최근에 인증한 시각(초)"을 구해요.
// 서명 검사는 getUser가 이미 했어요. 여기서는 내용만 읽어요.
export const lastAuthenticatedAt = (jwt: string): number | null => {
  try {
    const part = jwt.split('.')[1]
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    const times = (Array.isArray(payload.amr) ? payload.amr : [])
      .map((entry: any) => Number(entry?.timestamp))
      .filter((time: number) => Number.isFinite(time) && time > 0)
    return times.length ? Math.max(...times) : null
  } catch {
    return null
  }
}

export type Deps = {
  getUser: (jwt: string) => Promise<{ id: string } | null>
  deletePhotos: (userId: string) => Promise<void> // 실패하면 throw
  deleteUser: (userId: string) => Promise<void> // 실패하면 throw
  now?: () => number // 초 단위 현재 시각 (시험용)
  log?: (step: string, detail: string) => void
}

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
  const trace = { step: 'start' }
  try {
    return await processRequest(req, deps, trace)
  } catch (error) {
    safeLog(deps, trace.step, error)
    return rejection(500, 'INTERNAL', '서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
  }
}

const processRequest = async (req: Request, deps: Deps, trace: { step: string }): Promise<Response> => {
  if (req.method === 'OPTIONS') return json(200, { ok: true })
  if (req.method !== 'POST') return rejection(405, 'METHOD_NOT_ALLOWED', 'POST만 쓸 수 있어요.')

  trace.step = 'auth'
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  // 토큰 모양이 아니면(빈 값 · 공개용 키 sb_publishable_… · 엉터리 문자열) 인증 서버에 묻지 않고 바로 거절해요
  const user = JWT_SHAPE.test(jwt) ? await deps.getUser(jwt).catch(() => null) : null
  if (!user) return rejection(401, 'NOT_SIGNED_IN', '로그인이 필요해요.')
  // 인증 서버가 돌려준 id가 UUID가 아니면 아무것도 지우지 않아요 (빈 값이 저장소 전체를 가리키는 사고 방지)
  if (!UUID_PATTERN.test(String(user.id))) {
    safeLog(deps, 'auth', new Error('unexpected user id shape'))
    return rejection(401, 'NOT_SIGNED_IN', '로그인이 필요해요.')
  }

  // 최근에 다시 로그인한 세션인지 (비밀번호 재확인)
  const authenticatedAt = lastAuthenticatedAt(jwt)
  const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))()
  if (authenticatedAt === null || now - authenticatedAt > REAUTH_WINDOW_SECONDS) {
    return rejection(403, 'REAUTH_REQUIRED', '안전을 위해 비밀번호를 다시 확인해야 해요.')
  }

  trace.step = 'read-body'
  let body: any
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return rejection(413, 'TOO_LARGE', '요청이 너무 커요.')
    body = JSON.parse(raw)
  } catch {
    return rejection(400, 'INVALID_INPUT', '요청 내용이 올바르지 않아요.')
  }
  if (!body || body.confirm !== true) return rejection(400, 'CONFIRM_REQUIRED', '탈퇴 확인이 필요해요.')

  trace.step = 'delete-photos'
  try {
    await deps.deletePhotos(user.id)
  } catch (error) {
    safeLog(deps, 'delete-photos', error)
    return rejection(500, 'PHOTO_CLEANUP_FAILED', '사진 파일을 정리하지 못했어요. 계정은 그대로예요. 잠시 후 다시 시도해 주세요.')
  }

  trace.step = 'delete-user'
  try {
    await deps.deleteUser(user.id)
  } catch (error) {
    safeLog(deps, 'delete-user', error)
    return rejection(500, 'DELETE_FAILED', '계정을 지우지 못했어요. 잠시 후 다시 시도해 주세요. (사진은 이미 정리돼서 다시 시도해도 안전해요)')
  }

  // 마무리 청소: 사진을 지운 뒤 ~ 계정을 지우기 전 사이에 다른 기기에서 올린 사진이 있으면 주인 없는 파일로 남아요.
  // 계정은 이미 지워졌으니 실패해도 탈퇴는 성공으로 알리고, 서버 로그에만 남겨요 (운영자가 Storage에서 지울 수 있어요).
  trace.step = 'sweep-photos'
  try {
    await deps.deletePhotos(user.id)
  } catch (error) {
    safeLog(deps, 'sweep-photos', error)
  }
  return json(200, { ok: true })
}

// ── Edge Function 실행부 (Deno에서만 동작해요. 테스트에서는 위의 handleRequest만 불러요) ──
const startServer = () => {
  Deno.serve(async (req: Request) => {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const url = Deno.env.get('SUPABASE_URL')
    let secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    try {
      const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')
      secretKey = keys.default ?? Object.values(keys)[0] ?? secretKey
    } catch {
      // 새 키 형식이 없으면 기존 변수를 써요
    }
    if (!url || !secretKey) return rejection(500, 'NOT_CONFIGURED', '서버 설정이 끝나지 않았어요.')

    const admin = createClient(url, secretKey, { auth: { persistSession: false } })
    return handleRequest(req, {
      log: (step, detail) => console.error(`[delete-account] 실패 단계=${step} ${detail}`),
      getUser: async (jwt) => {
        const { data, error } = await admin.auth.getUser(jwt)
        if (error || !data.user) return null
        return { id: data.user.id }
      },
      deletePhotos: (userId) => deleteUserPhotos(admin.storage.from(PHOTO_BUCKET), userId),
      deleteUser: async (userId) => {
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) throw error
      },
    })
  })
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') startServer()
