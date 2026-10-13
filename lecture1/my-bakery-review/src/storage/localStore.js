// localStorage를 안전하게 읽고 쓰는 도우미예요.
//
// ⚠️ localStorage는 "이 브라우저, 이 주소(origin)"에만 저장돼요.
//   - 다른 사람과 공유되지 않아요 (서버가 아니에요)
//   - 주소가 다르면(localhost ↔ github.io) 서로 다른 저장소예요
//   - 사이트 데이터를 지우거나 시크릿 창을 닫으면 사라져요
// 그래서 이 파일을 쓰는 저장소(reviewRepository 등)는 포트폴리오 테스트용이에요.
// 나중에 Supabase 같은 실제 DB로 옮길 때는 src/storage 폴더만 바꾸면 돼요.

export class RepositoryError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'RepositoryError'
    this.code = code
  }
}

const STORAGE_FAILED_MESSAGE =
  '저장하지 못했어요. 브라우저 저장 공간이 부족하거나 저장이 막혀 있을 수 있어요. 사진을 빼고 다시 시도해 보세요.'

// 저장된 값을 읽어요. 값이 없으면 fallback을 돌려줘요.
// 값이 깨져 있으면(JSON이 아님) 덮어쓰기 전에 백업 키로 옮겨 둬서 데이터를 잃지 않게 해요.
export const readJson = (key, fallback) => {
  let raw
  try {
    raw = localStorage.getItem(key)
  } catch {
    return fallback
  }
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    try {
      localStorage.setItem(`${key}:corrupt-backup`, raw)
    } catch {
      // 백업도 못 하면 어쩔 수 없어요. 원본은 지우지 않아요.
    }
    return fallback
  }
}

// 값을 저장해요. 저장에 실패하면 성공한 척하지 않고 RepositoryError를 던져요.
// (일부 브라우저는 setItem이 조용히 실패하기도 해서, 다시 읽어서 정말 저장됐는지 확인해요.)
export const writeJson = (key, value) => {
  const serialized = JSON.stringify(value)
  try {
    localStorage.setItem(key, serialized)
    if (localStorage.getItem(key) !== serialized) {
      throw new Error('verify failed')
    }
  } catch {
    throw new RepositoryError('STORAGE_FAILED', STORAGE_FAILED_MESSAGE)
  }
}

// 다른 탭에서 같은 키가 바뀌면 알려줘요. 돌려받은 함수를 부르면 구독이 풀려요.
export const subscribeToKey = (key, onChange) => {
  const handler = (event) => {
    if (event.key === key || event.key === null) onChange()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

export const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
