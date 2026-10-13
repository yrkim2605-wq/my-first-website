import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProfileContext } from './contexts'
import { profileRepository } from '../storage/profileRepository'

// 지금 사용 중인 임시 로컬 프로필을 들고 있어요. (진짜 로그인이 아니라, 이 브라우저 안에서만 쓰는 닉네임 프로필이에요.)
// 저장소 호출은 모두 profileRepository를 거쳐요. 나중에 실제 인증으로 바꿔도 이 파일의 사용법은 그대로예요.
export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(
    () =>
      profileRepository.getCurrent().then((current) => {
        setProfile(current)
        setReady(true)
      }),
    [],
  )

  useEffect(() => {
    refresh()
    // 다른 탭에서 로그인 · 로그아웃해도 맞춰져요
    return profileRepository.subscribe(refresh)
  }, [refresh])

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

  const signOut = useCallback(async () => {
    await profileRepository.signOut()
    setProfile(null)
  }, [])

  const value = useMemo(() => ({ profile, ready, signUp, signIn, signOut }), [profile, ready, signUp, signIn, signOut])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
