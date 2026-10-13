import { useEffect, useState } from 'react'
import { VisitedBakeriesContext } from './contexts'

const STORAGE_KEY = 'my-bakery-review:visited-real-bakery-ids'

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
