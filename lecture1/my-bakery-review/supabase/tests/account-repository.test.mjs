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
      signOut: async () => {
        record('signOut', [])
        return { error: null }
      },
      resend: async (args) => {
        record('resend', args)
        return { error: state.resendError ?? null }
      },
      getSession: async () => ({
        data: { session: state.noSession ? null : { user: { id: 'u1', email: 'a@b.co', email_confirmed_at: state.unverified ? null : '2026-10-14' } } },
        error: null,
      }),
      initialize: async () => ({ error: state.initError ?? null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
  return { client, authError }
}
const repoFor = (state) => {
  const { client, authError } = makeClient(state)
  return { client, authError, repo: createAccountRepository(async () => client, { getRedirectUrl: () => 'https://example.test/app/' }) }
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
