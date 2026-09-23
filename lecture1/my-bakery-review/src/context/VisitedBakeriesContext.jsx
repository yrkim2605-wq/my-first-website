import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'my-bakery-review:visited-real-bakery-ids'
const VisitedBakeriesContext = createContext(null)

const loadInitialIds = () => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedIds))
  }, [visitedIds])

  const toggleVisited = (id) => {
    setVisitedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  return (
    <VisitedBakeriesContext.Provider value={{ visitedIds, toggleVisited }}>
      {children}
    </VisitedBakeriesContext.Provider>
  )
}

export const useVisitedBakeries = () => {
  const ctx = useContext(VisitedBakeriesContext)
  if (!ctx) {
    throw new Error('useVisitedBakeries는 VisitedBakeriesProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
