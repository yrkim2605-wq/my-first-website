import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProfileContext } from './contexts'
import { profileRepository } from '../storage/profileRepository'
import { createAccountRepository } from '../storage/accountRepository'
import { messageForCallbackError } from '../storage/authMessages'
import { takeAuthCallbackError } from '../lib/authCallback'
import { getBackendConfigProblem, IS_ACCOUNT_MODE } from '../lib/backend'
import { getAuthRedirectUrl, getSupabase } from '../lib/supabaseClient'

// 지금 사용 중인 프로필을 들고 있어요. 저장 방식은 VITE_DATA_BACKEND로 정해져요.
//  - local(기본): 이 브라우저 안에서만 쓰는 임시 닉네임 프로필 (진짜 로그인이 아니에요)
//  - supabase   : 이메일 인증을 마친 계정으로 로그인 (비밀번호는 Supabase가 보관해요)
// 계정 모드에서 연결이 안 되면 로컬로 대신 처리하지 않고, backendProblem으로 이유를 보여줘요.
const accountRepository = IS_ACCOUNT_MODE ? createAccountRepository(getSupabase, { getRedirectUrl: getAuthRedirectUrl }) : null

const notAvailable = () => Promise.reject(new Error('이 기능은 계정 모드에서만 쓸 수 있어요.'))

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [backendProblem, setBackendProblem] = useState(() => getBackendConfigProblem())
  const [authNotice, setAuthNotice] = useState(() => {
    const code = IS_ACCOUNT_MODE ? takeAuthCallbackError() : null
    return code ? { severity: 'error', message: messageForCallbackError(code) } : null
  })

  const refresh = useCallback(async () => {
    // 설정이 잘못됐으면(키 없음 · 비밀 키 등) 연결을 시도하지 않고 이유를 그대로 보여줘요
    const configProblem = IS_ACCOUNT_MODE ? getBackendConfigProblem() : null
    if (configProblem) {
      setProfile(null)
      setBackendProblem(configProblem)
      setReady(true)
      return
    }
    try {
      const current = IS_ACCOUNT_MODE ? await accountRepository.getCurrent() : await profileRepository.getCurrent()
      setProfile(current)
      if (IS_ACCOUNT_MODE) setBackendProblem(getBackendConfigProblem())
    } catch (error) {
      // 계정 모드에서 연결 실패: 로컬로 몰래 넘어가지 않고, 로그아웃 상태로 두고 이유를 알려요
      setProfile(null)
      if (IS_ACCOUNT_MODE) setBackendProblem(error.message)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}
    const start = async () => {
      if (IS_ACCOUNT_MODE && !getBackendConfigProblem()) {
        try {
          const notice = await accountRepository.finishRedirect()
          if (notice?.recovery) window.location.hash = '#/reset-password' // 비밀번호 재설정 링크로 들어왔어요
          else if (notice) setAuthNotice(notice)
        } catch (error) {
          setBackendProblem(error.message)
        }
      }
      await refresh()
    }
    start()
    // 다른 탭에서 로그인 · 로그아웃해도 맞춰져요
    unsubscribe = IS_ACCOUNT_MODE ? accountRepository.subscribe(refresh) : profileRepository.subscribe(refresh)
    return () => unsubscribe()
  }, [refresh])

  // ── 로컬 모드: 닉네임만 ──
  const signUp = useCallback(async (nickname) => {
    const created = await profileRepository.signUp(nickname)
    setProfile(created)
    return created
  }, [])

  const signIn = useCallback(async (nickname) => {
    const found = await profileRepository.signIn(nickname)
    setProfile(found)
    return found
  }, [])

  // ── 계정 모드: 이메일 + 비밀번호 ──
  const accountSignUp = useCallback((input) => accountRepository.signUp(input), [])
  const accountSignIn = useCallback(async (input) => {
    const found = await accountRepository.signIn(input)
    setProfile(found)
    return found
  }, [])
  const resendVerification = useCallback((email) => accountRepository.resendVerification(email), [])
  const requestPasswordReset = useCallback((email) => accountRepository.requestPasswordReset(email), [])
  const hasRecoverySession = useCallback(() => accountRepository.hasRecoverySession(), [])
  const updatePassword = useCallback(async (newPassword) => {
    await accountRepository.updatePassword(newPassword)
    setProfile(null) // 모든 기기에서 로그아웃됐어요
  }, [])
  const deleteAccount = useCallback(async (input) => {
    await accountRepository.deleteAccount(input)
    setProfile(null) // 계정이 지워졌어요
  }, [])
  const isNicknameAvailable = useCallback((nickname) => accountRepository.isNicknameAvailable(nickname), [])

  const signOut = useCallback(async () => {
    if (IS_ACCOUNT_MODE) await accountRepository.signOut()
    else await profileRepository.signOut()
    setProfile(null)
  }, [])

  const clearAuthNotice = useCallback(() => setAuthNotice(null), [])

  const value = useMemo(
    () => ({
      profile,
      ready,
      isAccountMode: IS_ACCOUNT_MODE,
      backendProblem,
      authNotice,
      clearAuthNotice,
      signUp,
      signIn,
      signOut,
      accountSignUp: IS_ACCOUNT_MODE ? accountSignUp : notAvailable,
      accountSignIn: IS_ACCOUNT_MODE ? accountSignIn : notAvailable,
      resendVerification: IS_ACCOUNT_MODE ? resendVerification : notAvailable,
      isNicknameAvailable: IS_ACCOUNT_MODE ? isNicknameAvailable : notAvailable,
      deleteAccount: IS_ACCOUNT_MODE ? deleteAccount : notAvailable,
      requestPasswordReset: IS_ACCOUNT_MODE ? requestPasswordReset : notAvailable,
      hasRecoverySession: IS_ACCOUNT_MODE ? hasRecoverySession : notAvailable,
      updatePassword: IS_ACCOUNT_MODE ? updatePassword : notAvailable,
    }),
    [profile, ready, backendProblem, authNotice, clearAuthNotice, signUp, signIn, signOut, accountSignUp, accountSignIn, resendVerification, isNicknameAvailable, requestPasswordReset, hasRecoverySession, updatePassword, deleteAccount],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
