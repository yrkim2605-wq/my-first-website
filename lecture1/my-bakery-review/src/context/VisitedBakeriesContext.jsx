import { useEffect, useState } from 'react'
import { VisitedBakeriesContext } from './contexts'
import { IS_ACCOUNT_MODE } from '../lib/backend'

const STORAGE_KEY = 'my-bakery-review:visited-real-bakery-ids'

const loadInitialIds = () => {
  if (IS_ACCOUNT_MODE) return [] // 계정 모드: 방문 체크의 계정 저장은 5단계에서 연결해요
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const VisitedBakeriesProvider = ({ children }) => {
  const [visitedIds, setVisitedIds] = useState(loadInitialIds)

  useEffect(() => {
    if (IS_ACCOUNT_MODE) return // 로컬 기록을 건드리지 않아요
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedIds))
  }, [visitedIds])

  const toggleVisited = (id) => {
    setVisitedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  return (
    <VisitedBakeriesContext.Provider value={{ visitedIds, toggleVisited, available: !IS_ACCOUNT_MODE }}>
      {children}
    </VisitedBakeriesContext.Provider>
  )
}
