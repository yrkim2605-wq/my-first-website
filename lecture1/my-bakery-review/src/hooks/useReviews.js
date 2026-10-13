import { useContext } from 'react'
import { ReviewsContext } from '../context/contexts'

export const useReviews = () => {
  const ctx = useContext(ReviewsContext)
  if (!ctx) throw new Error('useReviews는 ReviewsProvider 안에서만 사용할 수 있어요.')
  return ctx
}
