import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { BookmarksContext, ProfileContext } from './contexts'
import {
  BookmarkLimitError,
  readBookmarkStore,
  removeBookmarkFromStore,
  subscribeBookmarkStore,
  toggleBookmarkInStore,
  writeBookmarkStore,
} from '../storage/bookmarkStore'
import { IS_ACCOUNT_MODE } from '../lib/backend'

// "찜한 빵집" 목록이에요. 나만 보는 메모이고, 리뷰 · EXP · 도감 · 퀘스트에는 아무 영향이 없어요.
//  - 이 브라우저(localStorage)에만 저장돼요. 서버에는 저장하지 않고, 다른 기기와 공유되지 않아요.
//  - 로컬 모드: 이 브라우저의 목록 하나예요 (방문 체크와 같은 방식).
//  - 계정 모드: 로그인한 계정마다 따로 보관해요 (같은 브라우저를 같이 써도 서로의 찜이 섞이지 않아요).
//  - 저장에 실패하면 성공한 척하지 않고 이유를 알려요.

const EMPTY_ITEMS = []
const SAVE_FAILED_MESSAGE = '찜을 저장하지 못했어요. 브라우저 저장이 막혀 있거나 공간이 부족할 수 있어요.'

export const BookmarksProvider = ({ children }) => {
  const profileCtx = useContext(ProfileContext)
  const userId = profileCtx?.profile?.userId ?? null
  const ownerKey = IS_ACCOUNT_MODE ? `account:${userId ?? 'guest'}` : 'local'

  const [store, setStore] = useState(readBookmarkStore)
  const [notice, setNotice] = useState(null)

  // 다른 탭에서 찜을 바꿔도 이 탭에 바로 맞춰져요
  useEffect(() => subscribeBookmarkStore(() => setStore(readBookmarkStore())), [])

  const items = store[ownerKey] ?? EMPTY_ITEMS
  const idSet = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const isBookmarked = useCallback((bakeryId) => idSet.has(String(bakeryId)), [idSet])

  // 찜 / 해제. 저장에 성공하면 true(찜함) · false(해제함), 실패하면 null을 돌려주고 안내를 띄워요.
  const toggleBookmark = useCallback(
    (bakery) => {
      try {
        const latest = readBookmarkStore() // 다른 탭의 최근 변경까지 반영한 뒤에 바꿔요
        const { store: next, added } = toggleBookmarkInStore(latest, ownerKey, bakery)
        writeBookmarkStore(next)
        setStore(next)
        return added
      } catch (error) {
        setNotice(error instanceof BookmarkLimitError ? error.message : SAVE_FAILED_MESSAGE)
        return null
      }
    },
    [ownerKey],
  )

  const removeBookmark = useCallback(
    (bakeryId) => {
      try {
        const next = removeBookmarkFromStore(readBookmarkStore(), ownerKey, bakeryId)
        writeBookmarkStore(next)
        setStore(next)
        return true
      } catch {
        setNotice(SAVE_FAILED_MESSAGE)
        return false
      }
    },
    [ownerKey],
  )

  const value = useMemo(() => ({ items, isBookmarked, toggleBookmark, removeBookmark }), [items, isBookmarked, toggleBookmark, removeBookmark])

  return (
    <BookmarksContext.Provider value={value}>
      {children}
      <Snackbar open={Boolean(notice)} autoHideDuration={4500} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </BookmarksContext.Provider>
  )
}
