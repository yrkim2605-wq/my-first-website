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
//  4) 순서: 사진 파일 삭제 → 계정 삭제. 사진 삭제가 실패하면 계정은 그대로 두고 알려요 (다시 시도할 수 있어요).
//     계정 삭제가 실패해도 사진 삭제는 다시 해도 안전해요(이미 없는 파일은 건너뛰어요).
//  5) 서버 로그에는 실패한 단계와 오류 종류만 남겨요. 토큰 · 키는 쓰지 않아요.
//
// 이 파일 하나로 배포할 수 있어요 (대시보드 편집기에 붙여넣기). 판단 로직은 handleRequest이고,
// supabase/tests/delete-account.test.mjs가 Node로 검증해요.

// deno-lint-ignore-file no-explicit-any
declare const Deno: any

export const REAUTH_WINDOW_SECONDS = 10 * 60
export const MAX_BODY_BYTES = 1024
const PHOTO_BUCKET = 'photos'
const MAX_PHOTO_ROUNDS = 50 // 한 번에 100개씩 지워요 → 최대 5,000장. 무한 반복 방지용

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
  const user = jwt ? await deps.getUser(jwt).catch(() => null) : null
  if (!user) return rejection(401, 'NOT_SIGNED_IN', '로그인이 필요해요.')

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
      deletePhotos: async (userId) => {
        for (let round = 0; round < MAX_PHOTO_ROUNDS; round += 1) {
          const { data, error } = await admin.storage.from(PHOTO_BUCKET).list(userId, { limit: 100 })
          if (error) throw error
          const names = (data ?? []).filter((item: any) => item.name).map((item: any) => `${userId}/${item.name}`)
          if (names.length === 0) return
          const { error: removeError } = await admin.storage.from(PHOTO_BUCKET).remove(names)
          if (removeError) throw removeError
        }
        throw new Error('too many photo files')
      },
      deleteUser: async (userId) => {
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) throw error
      },
    })
  })
}

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') startServer()
