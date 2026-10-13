import { useContext } from 'react'
import { VisitedBakeriesContext } from '../context/contexts'

export const useVisitedBakeries = () => {
  const ctx = useContext(VisitedBakeriesContext)
  if (!ctx) {
    throw new Error('useVisitedBakeries는 VisitedBakeriesProvider 안에서만 사용할 수 있어요.')
  }
  return ctx
}
