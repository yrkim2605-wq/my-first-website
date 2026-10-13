import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ProfileContext, ReviewsContext } from './contexts'
import { reviewRepository as localReviewRepository } from '../storage/reviewRepository'
import { RepositoryError } from '../storage/localStore'
import { IS_ACCOUNT_MODE } from '../lib/backend'

// 계정 모드에서는 리뷰의 계정 저장이 아직 연결되지 않았어요 (4단계).
// 그동안 로컬에 몰래 저장해서 "저장됐다"고 보이면 안 되니까, 쓰기는 분명한 오류로 거절하고 목록은 비워 둬요.
// (로컬 모드의 기존 기록은 그대로 남아 있어요.)
const NOT_CONNECTED_MESSAGE = '계정으로 리뷰를 저장하는 기능은 아직 연결되지 않았어요. 지금은 저장되지 않아요.'
const notConnected = () => Promise.reject(new RepositoryError('NOT_CONNECTED', NOT_CONNECTED_MESSAGE))
const pendingReviewRepository = {
  list: async () => [],
  create: notConnected,
  update: notConnected,
  remove: notConnected,
  subscribe: () => () => {},
}
const reviewRepository = IS_ACCOUNT_MODE ? pendingReviewRepository : localReviewRepository

// 저장된 리뷰 전체(이 브라우저의 모든 프로필)를 들고, 현재 프로필의 이름으로 쓰기 · 고치기 · 지우기를 해요.
// 저장에 성공했을 때만 리뷰를 돌려주고, 실패하면 오류를 던져요 (화면은 이 오류를 보고 실패 안내를 보여줘요).
export const ReviewsProvider = ({ children }) => {
  const profileCtx = useContext(ProfileContext)
  const userId = profileCtx?.profile?.userId ?? null
  const authorNickname = profileCtx?.profile?.nickname ?? ''
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
      const created = await reviewRepository.create({ ...input, userId, authorNickname })
      await reload()
      return created
    },
    [userId, authorNickname, reload],
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
