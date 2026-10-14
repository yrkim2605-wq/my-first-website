// 계정 저장소(회원가입 · 로그인 · 재발송 · 오류 안내) 검증. 진짜 Supabase 서버에는 연결하지 않고 가짜 클라이언트로 시험해요.
// (Supabase에 가짜 계정을 만들지 않으려고, 서버 통신 부분만 가짜로 바꿨어요.)
//
// 실행 (프로젝트 폴더에서):  node supabase/tests/account-repository.test.mjs
// Vite의 모듈 로더를 빌려 src 파일을 그대로 불러와요 (프로젝트에 이미 설치돼 있어요).

import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
const load = (file) => server.ssrLoadModule(file)

// 브라우저 환경 흉내: 주소 · 기록 · 로컬 저장소(쓰기를 감시해서 "몰래 로컬 저장"이 없는지 확인해요)
const localWrites = []
globalThis.localStorage = { getItem: () => null, setItem: (...args) => localWrites.push(args), removeItem: () => {} }
let currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/'
globalThis.window = {
  get location() {
    return new URL(currentUrl)
  },
  history: { replaceState: (_s, _t, url) => (currentUrl = url) },
}

const { createAccountRepository, validateSignUpInput } = await load('/src/storage/accountRepository.js')
const { messageForCallbackError, AUTH_NETWORK_MESSAGE } = await load('/src/storage/authMessages.js')
const { isSecretKey } = await load('/src/lib/backend.js')

let passed = 0
const failures = []
const check = (name, ok, detail = '') => {
  if (ok) passed += 1
  else failures.push(`${name} ${detail}`)
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : ' ' + detail}`)
}
const rejects = async (promise) => {
  try {
    await promise
    return null
  } catch (error) {
    return error
  }
}

// 가짜 클라이언트: 시나리오는 state로 바꿔요
const makeClient = (state = {}) => {
  const calls = []
  const record = (name, args) => calls.push([name, args])
  const authError = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra })
  const client = {
    calls,
    rpc: async (name, args) => {
      record('rpc', [name, args])
      if (state.networkDown) throw new TypeError('Failed to fetch')
      return { data: state.nicknameAvailable ?? true, error: null }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: state.profile === undefined ? { id: 'u1', nickname: '빵덕후', created_at: '2026-10-14T00:00:00Z' } : state.profile,
            error: null,
          }),
        }),
      }),
    }),
    functions: {
      invoke: async (name, options) => {
        record('invoke', [name, options])
        if (state.invokeNetworkDown) return { data: null, error: Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError' }) }
        if (state.invokeErrorCode) {
          const status = state.invokeStatus ?? 500
          return { data: null, error: Object.assign(new Error('non-2xx'), { name: 'FunctionsHttpError', context: { status, json: async () => ({ error: { code: state.invokeErrorCode } }) } }) }
        }
        return { data: { ok: true }, error: null }
      },
    },
    auth: {
      signUp: async (args) => {
        record('signUp', args)
        if (state.networkDown) throw new TypeError('Failed to fetch')
        if (state.signUpError) return { data: {}, error: state.signUpError }
        return { data: { user: { identities: state.existingEmail ? [] : [{}] }, session: null }, error: null }
      },
      signInWithPassword: async (args) => {
        record('signIn', args)
        if (state.networkDown) throw Object.assign(new Error('fetch failed'), { name: 'AuthRetryableFetchError' })
        if (state.signInError) return { data: {}, error: state.signInError }
        return { data: { user: { id: 'u1', email: args.email, email_confirmed_at: state.unverified ? null : '2026-10-14' } }, error: null }
      },
      signOut: async (options) => {
        record('signOut', options ?? {})
        return { error: null }
      },
      resend: async (args) => {
        record('resend', args)
        return { error: state.resendError ?? null }
      },
      resetPasswordForEmail: async (email, options) => {
        record('resetPasswordForEmail', [email, options])
        if (state.networkDown) throw new TypeError('Failed to fetch')
        return { data: {}, error: state.resetError ?? null }
      },
      updateUser: async (attrs) => {
        record('updateUser', attrs)
        return { data: {}, error: state.updateError ?? null }
      },
      getSession: async () => ({
        data: {
          session: state.noSession
            ? null
            : { user: { id: 'u1', email: 'a@b.co', email_confirmed_at: state.unverified ? null : '2026-10-14', recovery_sent_at: state.recoverySentAt } },
        },
        error: null,
      }),
      initialize: async () => ({ error: state.initError ?? null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
  return { client, authError }
}
// 재설정 표식은 메모리에 두고 시험해요 (진짜 localStorage에는 쓰지 않아요)
const makeMarker = (fresh = false) => {
  const marker = { fresh, set: () => (marker.fresh = true), isFresh: () => marker.fresh, clear: () => (marker.fresh = false) }
  return marker
}
const repoFor = (state, { marker = makeMarker() } = {}) => {
  const { client, authError } = makeClient(state)
  return { client, authError, marker, repo: createAccountRepository(async () => client, { getRedirectUrl: () => 'https://example.test/app/', recoveryMarker: marker }) }
}

// ── 입력 검증 ──
check('이메일 형식이 아니면 거부', (await rejects(Promise.resolve().then(() => validateSignUpInput({ email: 'abc', password: '12345678', nickname: '빵덕후' }))))?.code === 'INVALID_EMAIL')
check('비밀번호 8자 미만 거부', (await rejects(Promise.resolve().then(() => validateSignUpInput({ email: 'a@b.co', password: '1234567', nickname: '빵덕후' }))))?.code === 'WEAK_PASSWORD')
check('닉네임 특수문자/길이 거부', (await rejects(Promise.resolve().then(() => validateSignUpInput({ email: 'a@b.co', password: '12345678', nickname: '빵<b>' }))))?.code === 'INVALID_NICKNAME')
check('올바른 입력은 이메일을 소문자로 정리', validateSignUpInput({ email: ' A@B.Co ', password: '12345678', nickname: ' 빵덕후 ' }).email === 'a@b.co')

// ── 회원가입 ──
{
  const { repo, client } = repoFor({ nicknameAvailable: false })
  const error = await rejects(repo.signUp({ email: 'a@b.co', password: 'password123', nickname: '빵덕후' }))
  check('닉네임 중복이면 가입 요청을 보내지 않아요', error?.code === 'NICKNAME_TAKEN' && !client.calls.some(([name]) => name === 'signUp'))
}
{
  const secret = 'Sup3rSecret!pw'
  const { repo, client } = repoFor({})
  const result = await repo.signUp({ email: 'A@B.co', password: secret, nickname: '빵덕후' })
  const sent = client.calls.find(([name]) => name === 'signUp')[1]
  check('가입 성공 → 인증 메일 안내 상태(로그인 아님)', result.needsVerification === true && result.email === 'a@b.co')
  check('가입 요청에 닉네임 · 메일 링크 주소가 들어가요', sent.options.data.nickname === '빵덕후' && sent.options.emailRedirectTo === 'https://example.test/app/')
  check('돌려주는 값에 비밀번호가 없어요', !JSON.stringify(result).includes(secret))
}
{
  const { repo } = repoFor({ existingEmail: true })
  check('이미 가입된 이메일 안내', (await rejects(repo.signUp({ email: 'a@b.co', password: 'password123', nickname: '빵덕후' })))?.code === 'EMAIL_TAKEN')
}
for (const [label, state, expected] of [
  ['약한 비밀번호', (a) => ({ signUpError: a('weak_password') }), 'WEAK_PASSWORD'],
  ['메일 발송 한도', (a) => ({ signUpError: a('over_email_send_rate_limit') }), 'EMAIL_RATE_LIMIT'],
  ['사용할 수 없는 이메일', (a) => ({ signUpError: a('email_address_invalid') }), 'INVALID_EMAIL'],
  ['DB 트리거 닉네임 실패', () => ({ signUpError: Object.assign(new Error('Database error saving new user'), { code: 'unexpected_failure' }) }), 'NICKNAME_UNAVAILABLE'],
  ['알 수 없는 오류', (a) => ({ signUpError: a('something_new') }), 'UNKNOWN'],
]) {
  const { authError } = makeClient()
  const { repo } = repoFor(state(authError))
  const error = await rejects(repo.signUp({ email: 'a@b.co', password: 'password123', nickname: '빵덕후' }))
  check(`가입 오류 안내: ${label}`, error?.code === expected && /[가-힣]/.test(error.message), String(error?.code))
}
{
  const { repo } = repoFor({ networkDown: true })
  const error = await rejects(repo.signUp({ email: 'a@b.co', password: 'password123', nickname: '빵덕후' }))
  check('서버 연결 실패 → 오류 안내(저장 안 됨 문구)', error?.code === 'NETWORK' && error.message === AUTH_NETWORK_MESSAGE)
}

// ── 로그인 ──
{
  const { repo } = repoFor({})
  const profile = await repo.signIn({ email: 'A@B.co', password: 'password123' })
  check('로그인 성공 → 프로필 반환', profile.userId === 'u1' && profile.nickname === '빵덕후' && profile.email === 'a@b.co')
}
for (const [label, state, expected] of [
  ['잘못된 비밀번호', (a) => ({ signInError: a('invalid_credentials') }), 'INVALID_CREDENTIALS'],
  ['이메일 미인증(서버가 거부)', (a) => ({ signInError: a('email_not_confirmed') }), 'EMAIL_NOT_CONFIRMED'],
  ['요청 과다', (a) => ({ signInError: a('over_request_rate_limit') }), 'REQUEST_RATE_LIMIT'],
]) {
  const { authError } = makeClient()
  const { repo } = repoFor(state(authError))
  check(`로그인 오류 안내: ${label}`, (await rejects(repo.signIn({ email: 'a@b.co', password: 'x'.repeat(8) })))?.code === expected)
}
{
  const { repo, client } = repoFor({ unverified: true })
  const error = await rejects(repo.signIn({ email: 'a@b.co', password: 'password123' }))
  check('인증이 안 된 세션이 오면 로그아웃시키고 거부', error?.code === 'EMAIL_NOT_CONFIRMED' && client.calls.some(([name]) => name === 'signOut'))
}
{
  const { repo, client } = repoFor({ profile: null })
  const error = await rejects(repo.signIn({ email: 'a@b.co', password: 'password123' }))
  check('프로필이 없으면 로그인 상태로 두지 않아요', error?.code === 'PROFILE_MISSING' && client.calls.some(([name]) => name === 'signOut'))
}
{
  const { repo } = repoFor({ networkDown: true })
  const error = await rejects(repo.signIn({ email: 'a@b.co', password: 'password123' }))
  check('로그인 중 연결 실패 → 오류 안내', error?.code === 'NETWORK')
}
check('비밀번호를 비우면 거부', (await rejects(repoFor({}).repo.signIn({ email: 'a@b.co', password: '' })))?.code === 'INVALID_CREDENTIALS')

// ── 현재 로그인 상태 ──
check('인증된 세션 → 프로필', (await repoFor({}).repo.getCurrent())?.nickname === '빵덕후')
check('인증 안 된 세션은 로그인으로 인정하지 않아요', (await repoFor({ unverified: true }).repo.getCurrent()) === null)
check('세션이 없으면 null', (await repoFor({ noSession: true }).repo.getCurrent()) === null)

// ── 인증 메일 재발송 ──
{
  const { repo, client } = repoFor({})
  await repo.resendVerification(' A@B.co ')
  const sent = client.calls.find(([name]) => name === 'resend')[1]
  check('재발송 요청: 가입 메일 종류 · 소문자 이메일 · 돌아올 주소', sent.type === 'signup' && sent.email === 'a@b.co' && sent.options.emailRedirectTo === 'https://example.test/app/')
}
{
  const { authError } = makeClient()
  const { repo } = repoFor({ resendError: authError('over_email_send_rate_limit') })
  check('재발송 한도 초과 안내', (await rejects(repo.resendVerification('a@b.co')))?.code === 'EMAIL_RATE_LIMIT')
}
check('재발송 이메일 형식 오류', (await rejects(repoFor({}).repo.resendVerification('abc')))?.code === 'INVALID_EMAIL')

// ── 메일 링크로 돌아온 경우 ──
{
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/'
  check('?code가 없으면 아무것도 안 해요', (await repoFor({}).repo.finishRedirect()) === null)
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/?code=abc123#/'
  const ok = await repoFor({}).repo.finishRedirect()
  check('링크로 돌아와 로그인 처리 성공 안내 + 주소의 code 제거', ok?.severity === 'success' && !String(currentUrl).includes('code='), currentUrl)
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/?code=abc123#/'
  const failed = await repoFor({ initError: new Error('pkce') }).repo.finishRedirect()
  check('다른 브라우저에서 열면 "로그인해 주세요" 안내', failed?.severity === 'info' && /로그인/.test(failed.message))
}
check('링크 만료 코드 안내', /만료/.test(messageForCallbackError('otp_expired')))
check('알 수 없는 링크 오류도 안내', /다시 받아/.test(messageForCallbackError('???')))

// ── 비밀번호 찾기 · 재설정 ──
{
  const { repo, client, marker } = repoFor({})
  await repo.requestPasswordReset(' A@B.co ')
  const [email, options] = client.calls.find(([name]) => name === 'resetPasswordForEmail')[1]
  check('재설정 메일 요청: 이메일 정리 + 돌아올 주소 전달 + 요청 표식 남김', email === 'a@b.co' && options.redirectTo === 'https://example.test/app/' && marker.fresh === true)
}
check('재설정 요청 이메일 형식 오류', (await rejects(repoFor({}).repo.requestPasswordReset('abc')))?.code === 'INVALID_EMAIL')
{
  const { repo, marker } = repoFor({ resetError: Object.assign(new Error('x'), { code: 'over_email_send_rate_limit' }) })
  check('재설정 메일 한도 초과 안내 + 표식은 남기지 않아요', (await rejects(repo.requestPasswordReset('a@b.co')))?.code === 'EMAIL_RATE_LIMIT' && marker.fresh === false)
}
check('재설정 요청 네트워크 오류 안내', (await rejects(repoFor({ networkDown: true }).repo.requestPasswordReset('a@b.co')))?.code === 'NETWORK')
{
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/?code=abc123#/'
  const recent = new Date(Date.now() - 60 * 1000).toISOString()
  const notice = await repoFor({ recoverySentAt: recent }, { marker: makeMarker(true) }).repo.finishRedirect()
  check('재설정 링크로 돌아오면 recovery로 알려줘요', notice?.recovery === true)
}
{
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/?code=abc123#/'
  const notice = await repoFor({ recoverySentAt: new Date().toISOString() }, { marker: makeMarker(false) }).repo.finishRedirect()
  check('요청 표식이 없으면(다른 사람의 링크 등) 재설정으로 보지 않아요', !notice?.recovery && notice?.severity === 'success')
}
{
  currentUrl = 'http://localhost:5173/my-first-website/my-bakery-review/?code=abc123#/'
  const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const notice = await repoFor({ recoverySentAt: old }, { marker: makeMarker(true) }).repo.finishRedirect()
  check('재설정 메일 발송 시각이 1시간 넘었으면 재설정으로 보지 않아요 (인증 메일 링크와 구별)', !notice?.recovery)
}
check('표식 + 세션이 있어야 재설정 화면 허용', (await repoFor({}, { marker: makeMarker(true) }).repo.hasRecoverySession()) === true)
check('표식이 없으면 재설정 화면 거부', (await repoFor({}, { marker: makeMarker(false) }).repo.hasRecoverySession()) === false)
check('세션이 없으면 재설정 화면 거부', (await repoFor({ noSession: true }, { marker: makeMarker(true) }).repo.hasRecoverySession()) === false)
{
  const { repo, client, marker } = repoFor({}, { marker: makeMarker(true) })
  await repo.updatePassword('newPassword1')
  const names = client.calls.map(([name]) => name)
  const signOut = client.calls.find(([name]) => name === 'signOut')
  check('비밀번호 변경 → 모든 기기 로그아웃 + 표식 삭제', names.includes('updateUser') && signOut[1].scope === 'global' && marker.fresh === false)
}
{
  const { repo, client } = repoFor({}, { marker: makeMarker(true) })
  const error = await rejects(repo.updatePassword('1234567'))
  check('8자 미만이면 서버에 보내지 않아요', error?.code === 'WEAK_PASSWORD' && !client.calls.some(([name]) => name === 'updateUser'))
}
{
  const { repo, client } = repoFor({}, { marker: makeMarker(false) })
  const error = await rejects(repo.updatePassword('newPassword1'))
  check('표식이 없으면 비밀번호를 바꾸지 않아요 (이미 로그인한 사람이 우연히 호출해도)', error?.code === 'LINK_EXPIRED' && !client.calls.some(([name]) => name === 'updateUser'))
}
{
  const { repo, marker } = repoFor({ updateError: Object.assign(new Error('x'), { code: 'same_password' }) }, { marker: makeMarker(true) })
  const error = await rejects(repo.updatePassword('samePassword1'))
  check('이전과 같은 비밀번호 안내 + 표식은 유지(다시 시도 가능)', error?.code === 'SAME_PASSWORD' && marker.fresh === true)
}

// ── 회원 탈퇴 ──
{
  const { repo, client } = repoFor({})
  await repo.deleteAccount({ password: 'myPassword1' })
  const names = client.calls.map(([name]) => name)
  const invoke = client.calls.find(([name]) => name === 'invoke')[1]
  const lastSignOut = client.calls.filter(([name]) => name === 'signOut').pop()
  check('탈퇴: 비밀번호 재로그인 → 서버 함수 호출 → 이 브라우저 로그아웃 순서', names.indexOf('signIn') < names.indexOf('invoke') && names.indexOf('invoke') < names.lastIndexOf('signOut'))
  check('탈퇴 함수에는 confirm만 보내요 (지울 사용자 id는 보내지 않아요)', invoke[0] === 'delete-account' && JSON.stringify(invoke[1]) === JSON.stringify({ body: { confirm: true } }))
  check('탈퇴 후 로그아웃은 이 브라우저(local)만', lastSignOut[1].scope === 'local')
}
{
  const { repo, client, authError } = repoFor({ signInError: Object.assign(new Error('bad'), { name: 'AuthApiError', code: 'invalid_credentials' }) })
  const error = await rejects(repo.deleteAccount({ password: 'wrong' }))
  check('비밀번호가 틀리면 서버 함수를 부르지 않아요', error?.code === 'INVALID_CREDENTIALS' && !client.calls.some(([name]) => name === 'invoke'))
}
check('비밀번호를 비우면 거부', (await rejects(repoFor({}).repo.deleteAccount({ password: '' })))?.code === 'INVALID_CREDENTIALS')
check('로그인 상태가 아니면 거부', (await rejects(repoFor({ noSession: true }).repo.deleteAccount({ password: 'x1234567' })))?.code === 'NOT_SIGNED_IN')
for (const [code, expected, pattern] of [
  ['REAUTH_REQUIRED', 'REAUTH_REQUIRED', /다시/],
  ['PHOTO_CLEANUP_FAILED', 'PHOTO_CLEANUP_FAILED', /계정은 그대로/],
  ['DELETE_FAILED', 'DELETE_FAILED', /다시 시도/],
]) {
  const { repo, client } = repoFor({ invokeErrorCode: code })
  const error = await rejects(repo.deleteAccount({ password: 'myPassword1' }))
  const signedOutAfter = client.calls.filter(([name]) => name === 'signOut').length > 0
  check(`탈퇴 서버 오류 ${code} → 안내 + 로그아웃하지 않아요(계정이 남아 있으니까)`, error?.code === expected && pattern.test(error.message) && !signedOutAfter)
}
check('탈퇴 함수가 아직 배포되지 않았으면(404) 설정 안내', (await rejects(repoFor({ invokeErrorCode: 'X', invokeStatus: 404 }).repo.deleteAccount({ password: 'myPassword1' })))?.code === 'FUNCTION_MISSING')
check('탈퇴 중 네트워크 오류 안내', (await rejects(repoFor({ invokeNetworkDown: true }).repo.deleteAccount({ password: 'myPassword1' })))?.code === 'NETWORK')

// ── 비밀 키 방어 / 로컬 몰래 저장 없음 ──
const jwt = (role) => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`
check('비밀 키(sb_secret_) 감지', isSecretKey('sb_secret_abc') === true)
check('service_role JWT 감지', isSecretKey(jwt('service_role')) === true)
check('publishable / anon 키는 통과', isSecretKey('sb_publishable_abc') === false && isSecretKey(jwt('anon')) === false)
check('이 모든 시나리오에서 localStorage에 아무것도 쓰지 않았어요', localWrites.length === 0, JSON.stringify(localWrites))

await server.close()
console.log(`\n통과 ${passed} · 실패 ${failures.length}`)
if (failures.length) {
  console.log(failures.join('\n'))
  process.exit(1)
}
