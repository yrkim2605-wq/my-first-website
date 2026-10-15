import { useContext } from 'react'
import { BookmarksContext } from '../context/contexts'

export const useBookmarks = () => {
  const ctx = useContext(BookmarksContext)
  if (!ctx) {
    throw new Error('useBookmarks는 BookmarksProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
