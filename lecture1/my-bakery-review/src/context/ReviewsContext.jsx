import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ProfileContext, ReviewsContext } from './contexts'
import { reviewRepository } from '../storage/reviewRepository'

// 저장된 리뷰 전체(이 브라우저의 모든 프로필)를 들고, 현재 프로필의 이름으로 쓰기 · 고치기 · 지우기를 해요.
// 저장에 성공했을 때만 리뷰를 돌려주고, 실패하면 오류를 던져요 (화면은 이 오류를 보고 실패 안내를 보여줘요).
export const ReviewsProvider = ({ children }) => {
  const profileCtx = useContext(ProfileContext)
  const userId = profileCtx?.profile?.userId ?? null
  const [reviews, setReviews] = useState([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(
    () =>
      reviewRepository.list().then((items) => {
        setReviews(items)
        setLoaded(true)
      }),
    [],
  )

  useEffect(() => {
    reload()
    // 다른 탭에서 리뷰를 쓰면 이 탭에도 반영돼요
    return reviewRepository.subscribe(reload)
  }, [reload])

  const createReview = useCallback(
    async (input) => {
      const created = await reviewRepository.create({ ...input, userId })
      await reload()
      return created
    },
    [userId, reload],
  )

  const updateReview = useCallback(
    async (reviewId, patch) => {
      const updated = await reviewRepository.update(reviewId, userId, patch)
      await reload()
      return updated
    },
    [userId, reload],
  )

  const removeReview = useCallback(
    async (reviewId) => {
      await reviewRepository.remove(reviewId, userId)
      await reload()
    },
    [userId, reload],
  )

  const value = useMemo(
    () => ({ reviews, loaded, createReview, updateReview, removeReview }),
    [reviews, loaded, createReview, updateReview, removeReview],
  )

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}
