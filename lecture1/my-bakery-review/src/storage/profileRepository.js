import { RepositoryError, createId, readJson, subscribeToKey, writeJson } from './localStore'

// 임시 로컬 프로필 저장소예요.
// ⚠️ 진짜 로그인(인증)이 아니에요. 닉네임만으로 "이 브라우저 안에서" 사용자를 구분해요.
//    비밀번호는 받지도, 저장하지도 않아요. 다른 기기 · 다른 브라우저와는 연결되지 않아요.
//
// 저장 모양 (버전 1):
//   { version: 1, currentUserId: string | null, profiles: [{ userId, nickname, createdAt }] }
// 모든 함수가 Promise를 돌려줘서, 나중에 실제 인증(Supabase 등)으로 바꿔도 호출하는 쪽은 그대로예요.

export const PROFILES_STORAGE_KEY = 'my-bakery-review:v1:profiles'

export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12

const EMPTY_STATE = { version: 1, currentUserId: null, profiles: [] }

const readState = () => {
  const state = readJson(PROFILES_STORAGE_KEY, EMPTY_STATE)
  if (!state || !Array.isArray(state.profiles)) return { ...EMPTY_STATE }
  return { ...EMPTY_STATE, ...state }
}

const sameNickname = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

const validateNickname = (raw) => {
  const nickname = (raw ?? '').trim()
  if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
    throw new RepositoryError('INVALID_NICKNAME', `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해주세요.`)
  }
  return nickname
}

export const profileRepository = {
  async list() {
    return readState().profiles
  },

  // 지금 이 브라우저에서 사용 중인 프로필 (없으면 null)
  async getCurrent() {
    const state = readState()
    return state.profiles.find((profile) => profile.userId === state.currentUserId) ?? null
  },

  // 새 프로필을 만들고 바로 그 프로필로 시작해요. 같은 닉네임이 이미 있으면 만들지 않아요.
  async signUp(rawNickname) {
    const nickname = validateNickname(rawNickname)
    const state = readState()
    if (state.profiles.some((profile) => sameNickname(profile.nickname, nickname))) {
      throw new RepositoryError('NICKNAME_TAKEN', '이 브라우저에 이미 있는 닉네임이에요. 로그인에서 이어서 해보세요.')
    }
    const profile = { userId: createId(), nickname, createdAt: new Date().toISOString() }
    writeJson(PROFILES_STORAGE_KEY, { ...state, currentUserId: profile.userId, profiles: [...state.profiles, profile] })
    return profile
  },

  // 이 브라우저에 있는 프로필로 이어서 시작해요 (비밀번호 확인 없음).
  async signIn(rawNickname) {
    const nickname = validateNickname(rawNickname)
    const state = readState()
    const profile = state.profiles.find((item) => sameNickname(item.nickname, nickname))
    if (!profile) {
      throw new RepositoryError('PROFILE_NOT_FOUND', '이 브라우저에 없는 닉네임이에요. 먼저 회원가입(모험가 등록)을 해주세요.')
    }
    writeJson(PROFILES_STORAGE_KEY, { ...state, currentUserId: profile.userId })
    return profile
  },

  // 로그아웃: 프로필과 리뷰 기록은 지우지 않고, "지금 사용 중"만 해제해요.
  async signOut() {
    const state = readState()
    writeJson(PROFILES_STORAGE_KEY, { ...state, currentUserId: null })
  },

  subscribe(onChange) {
    return subscribeToKey(PROFILES_STORAGE_KEY, onChange)
  },
}
