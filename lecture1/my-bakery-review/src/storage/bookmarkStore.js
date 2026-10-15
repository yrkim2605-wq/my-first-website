// 찜한 빵집 목록의 저장 · 읽기 도우미예요. (EXP · 도감 · 리뷰와는 완전히 따로 저장돼요)
//
// - 찜은 "나만 보는 메모"라서 서버에 저장하지 않고 이 브라우저(localStorage)에만 저장해요.
//   서버(Supabase)에 새 표가 필요 없어서, 계정 모드에서도 서버를 바꾸지 않아요.
// - 저장 모양: { [소유자 키]: [찜 항목, ...] } — 소유자 키는 BookmarksContext가 정해요.
//   (로컬 모드 'local' / 계정 모드 'account:<사용자 id>' 또는 'account:guest')
// - 찜 항목에는 마이페이지에서 목록을 그릴 만큼의 정보(이름 · 지역 · 메뉴 · 주소 · 사진 번호)를 같이 저장해요.
//   카카오에서 빵집 목록을 못 불러와도 내 찜 목록은 그대로 보이게 하려는 거예요.

import { readJson, writeJson, subscribeToKey } from './localStore'

export const BOOKMARKS_STORAGE_KEY = 'my-bakery-review:v1:bookmarks'
export const MAX_BOOKMARKS = 200

const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// 빵집 정보에서 저장할 항목을 만들어요. id는 항상 문자열로 맞춰요 (카카오 id는 문자열, 예시 빵집 id는 숫자예요).
export const toBookmarkItem = (bakery, now = new Date()) => ({
  id: String(bakery.id),
  name: cleanText(bakery.name, 100),
  districtLabel: cleanText(bakery.districtLabel, 30),
  signatureMenu: cleanText(bakery.signatureMenu, 40),
  address: cleanText(bakery.address, 120),
  photoSlot: Number.isInteger(bakery.photoSlot) && bakery.photoSlot >= 0 ? bakery.photoSlot : null,
  savedAt: now.toISOString(),
})

// 저장돼 있던 값이 깨졌거나 모양이 달라도 화면이 멈추지 않게, 쓸 수 있는 항목만 골라요.
const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []
  const seen = new Set()
  const result = []
  for (const item of items) {
    if (!item || (typeof item.id !== 'string' && typeof item.id !== 'number')) continue
    const id = String(item.id)
    const name = cleanText(item.name, 100)
    if (!id || !name || seen.has(id)) continue
    seen.add(id)
    result.push({
      id,
      name,
      districtLabel: cleanText(item.districtLabel, 30),
      signatureMenu: cleanText(item.signatureMenu, 40),
      address: cleanText(item.address, 120),
      photoSlot: Number.isInteger(item.photoSlot) && item.photoSlot >= 0 ? item.photoSlot : null,
      savedAt: typeof item.savedAt === 'string' ? item.savedAt : '',
    })
  }
  return result
}

export const normalizeBookmarkStore = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(Object.entries(raw).map(([owner, items]) => [owner, normalizeItems(items)]))
}

export const readBookmarkStore = () => normalizeBookmarkStore(readJson(BOOKMARKS_STORAGE_KEY, {}))

// 저장에 실패하면(저장 공간 부족 · 저장 차단) RepositoryError를 던져요. 성공한 척하지 않아요.
export const writeBookmarkStore = (store) => writeJson(BOOKMARKS_STORAGE_KEY, store)

export const subscribeBookmarkStore = (onChange) => subscribeToKey(BOOKMARKS_STORAGE_KEY, onChange)

// 찜 목록에 빵집을 넣거나 빼요. 새 store와 결과(added: true/false)를 돌려주고, 원본 store는 바꾸지 않아요.
export class BookmarkLimitError extends Error {
  constructor() {
    super(`찜은 최대 ${MAX_BOOKMARKS}곳까지 담을 수 있어요. 안 가는 곳을 먼저 해제해 주세요.`)
    this.name = 'BookmarkLimitError'
  }
}

export const toggleBookmarkInStore = (store, ownerKey, bakery, now = new Date()) => {
  const current = store[ownerKey] ?? []
  const id = String(bakery.id)
  const exists = current.some((item) => item.id === id)
  if (!exists && current.length >= MAX_BOOKMARKS) throw new BookmarkLimitError()
  const next = exists ? current.filter((item) => item.id !== id) : [toBookmarkItem(bakery, now), ...current]
  return { store: { ...store, [ownerKey]: next }, added: !exists }
}

export const removeBookmarkFromStore = (store, ownerKey, bakeryId) => {
  const id = String(bakeryId)
  const current = store[ownerKey] ?? []
  return { ...store, [ownerKey]: current.filter((item) => item.id !== id) }
}
