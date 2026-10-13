import { RepositoryError } from './localStore'
import { toAuthError } from './authMessages'

// 계정(Supabase Auth) 저장소예요. 비밀번호는 이 앱이 저장하지도, 기억하지도 않아요.
// - 비밀번호는 Supabase Auth 서버로만 보내고, 서버가 해시로 보관해요.
// - 브라우저에는 로그인 세션(토큰)만 남아요. 비밀번호는 남지 않아요.
// - 이메일 인증을 마친 사용자만 로그인된 상태로 인정해요.
// - 연결에 실패하면 로컬에 대신 저장하지 않고 오류를 그대로 던져요.
//
// getClient: () => Promise<SupabaseClient>  (테스트에서는 가짜 클라이언트를 넣어요)
// 돌려주는 프로필 모양은 임시 로컬 프로필과 같아요: { userId, nickname, createdAt } (+ email)

export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]{2,12}$/
export const NICKNAME_RULE_TEXT = '2~12자, 한글 · 영문 · 숫자 · 밑줄(_)만 쓸 수 있어요.'
export const PASSWORD_MIN = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateSignUpInput = ({ email, password, nickname }) => {
  const cleanEmail = String(email ?? '').trim().toLowerCase()
  const cleanNickname = String(nickname ?? '').trim()
  if (!EMAIL_PATTERN.test(cleanEmail)) throw new RepositoryError('INVALID_EMAIL', '이메일 주소를 정확히 입력해 주세요.')
  if (String(password ?? '').length < PASSWORD_MIN) {
    throw new RepositoryError('WEAK_PASSWORD', `비밀번호는 ${PASSWORD_MIN}자 이상으로 입력해 주세요.`)
  }
  if (!NICKNAME_PATTERN.test(cleanNickname)) throw new RepositoryError('INVALID_NICKNAME', `닉네임은 ${NICKNAME_RULE_TEXT}`)
  return { email: cleanEmail, password, nickname: cleanNickname }
}

const normalizeEmail = (email) => {
  const clean = String(email ?? '').trim().toLowerCase()
  if (!EMAIL_PATTERN.test(clean)) throw new RepositoryError('INVALID_EMAIL', '이메일 주소를 정확히 입력해 주세요.')
  return clean
}

export const createAccountRepository = (getClient, { getRedirectUrl = () => undefined } = {}) => {
  // 로그인한 사용자의 공개 프로필(닉네임)을 가져와요. 없으면 null.
  const loadProfile = async (client, user) => {
    const { data, error } = await client.from('profiles').select('id, nickname, created_at').eq('id', user.id).maybeSingle()
    if (error) throw toAuthError(error)
    if (!data) return null
    return { userId: data.id, nickname: data.nickname, createdAt: data.created_at, email: user.email ?? null }
  }

  const isVerified = (user) => Boolean(user?.email_confirmed_at)

  return {
    // 닉네임을 쓸 수 있는지 (형식 + 중복). 로그인 전에도 호출할 수 있어요.
    async isNicknameAvailable(nickname) {
      const clean = String(nickname ?? '').trim()
      if (!NICKNAME_PATTERN.test(clean)) return false
      try {
        const client = await getClient()
        const { data, error } = await client.rpc('is_nickname_available', { p_nickname: clean })
        if (error) throw error
        return data === true
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 회원가입. 성공하면 "인증 메일을 보냈어요" 상태를 돌려줘요 (이 시점에는 로그인되지 않아요).
    async signUp(input) {
      const { email, password, nickname } = validateSignUpInput(input)
      try {
        const client = await getClient()
        const { data: available, error: checkError } = await client.rpc('is_nickname_available', { p_nickname: nickname })
        if (checkError) throw checkError
        if (available !== true) throw new RepositoryError('NICKNAME_TAKEN', '이미 사용 중인 닉네임이에요. 다른 닉네임을 골라 주세요.')

        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { nickname }, emailRedirectTo: getRedirectUrl() },
        })
        if (error) throw error
        // 이미 가입된 이메일이면 보안상 오류 대신 "identities가 빈 사용자"가 와요
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new RepositoryError('EMAIL_TAKEN', '이미 가입된 이메일이에요. 로그인하거나, 인증 메일을 못 받았다면 재발송해 주세요.')
        }
        return { email, needsVerification: !data.session }
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 로그인. 인증을 마치지 않았거나 프로필이 없으면 로그인 상태로 두지 않아요.
    async signIn({ email, password }) {
      const cleanEmail = normalizeEmail(email)
      if (!password) throw new RepositoryError('INVALID_CREDENTIALS', '비밀번호를 입력해 주세요.')
      try {
        const client = await getClient()
        const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password })
        if (error) throw error
        if (!isVerified(data.user)) {
          await client.auth.signOut()
          throw toAuthError({ code: 'email_not_confirmed' })
        }
        const profile = await loadProfile(client, data.user)
        if (!profile) {
          await client.auth.signOut()
          throw new RepositoryError('PROFILE_MISSING', '프로필을 찾지 못했어요. 잠시 후 다시 시도하거나 새로 가입해 주세요.')
        }
        return profile
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 인증 메일 다시 보내기
    async resendVerification(email) {
      const clean = normalizeEmail(email)
      try {
        const client = await getClient()
        const { error } = await client.auth.resend({ type: 'signup', email: clean, options: { emailRedirectTo: getRedirectUrl() } })
        if (error) throw error
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 지금 로그인된 프로필 (없으면 null). 인증이 안 된 세션은 로그인으로 인정하지 않아요.
    async getCurrent() {
      try {
        const client = await getClient()
        const { data, error } = await client.auth.getSession()
        if (error) throw error
        const user = data.session?.user
        if (!user || !isVerified(user)) return null
        return await loadProfile(client, user)
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 메일 링크(?code=)로 돌아왔을 때 로그인 처리를 마무리하고, 실패하면 이유를 알려줘요.
    // 다른 브라우저에서 링크를 열면 이메일 인증은 끝났어도 자동 로그인은 안 될 수 있어요.
    async finishRedirect() {
      const hadCode = new URLSearchParams(window.location.search).has('code')
      if (!hadCode) return null
      try {
        const client = await getClient()
        const { error } = await client.auth.initialize()
        if (error) {
          return { severity: 'info', message: '이메일 인증은 끝났을 수 있어요. 이 화면에서 로그인해 주세요. (다른 브라우저에서 링크를 열면 자동 로그인은 되지 않아요)' }
        }
        return { severity: 'success', message: '이메일 인증이 완료됐어요! 환영해요.' }
      } catch (error) {
        throw toAuthError(error)
      } finally {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        window.history.replaceState({}, '', url.toString())
      }
    },

    async signOut() {
      try {
        const client = await getClient()
        const { error } = await client.auth.signOut()
        if (error) throw error
      } catch (error) {
        throw toAuthError(error)
      }
    },

    // 로그인 · 로그아웃이 일어나면 알려줘요. 돌려받은 함수를 부르면 구독이 풀려요.
    subscribe(onChange) {
      let unsubscribe = () => {}
      let cancelled = false
      getClient()
        .then((client) => {
          if (cancelled) return
          const { data } = client.auth.onAuthStateChange(() => {
            // 콜백 안에서 바로 Supabase를 부르면 멈출 수 있어서 한 박자 늦춰요
            setTimeout(onChange, 0)
          })
          unsubscribe = () => data.subscription.unsubscribe()
        })
        .catch(() => {})
      return () => {
        cancelled = true
        unsubscribe()
      }
    },
  }
}
