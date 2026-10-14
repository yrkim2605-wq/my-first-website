import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ProfileContext, ReviewsContext } from './contexts'
import { reviewRepository as localReviewRepository } from '../storage/reviewRepository'
import { createSupabaseReviewRepository } from '../storage/supabaseReviewRepository'
import { IS_ACCOUNT_MODE, getBackendConfigProblem } from '../lib/backend'
import { getSupabase } from '../lib/supabaseClient'
import { LEVELS } from '../constants/levels'

// 저장된 리뷰를 들고, 현재 프로필의 이름으로 쓰기 · 고치기 · 지우기를 해요.
//  - 로컬 모드: 이 브라우저의 모든 프로필 리뷰 (localStorage)
//  - 계정 모드: Supabase의 공개 리뷰(최신 500개) + 내 리뷰 전체. 연결이 안 되면 로컬로 대신 저장하지 않고 오류를 보여줘요.
// 저장에 성공했을 때만 리뷰를 돌려주고, 실패하면 오류를 던져요 (화면은 이 오류를 보고 실패 안내를 보여줘요).
const reviewRepository = IS_ACCOUNT_MODE ? createSupabaseReviewRepository(getSupabase) : localReviewRepository

export const ReviewsProvider = ({ children }) => {
  const profileCtx = useContext(ProfileContext)
  const userId = profileCtx?.profile?.userId ?? null
  const authorNickname = profileCtx?.profile?.nickname ?? ''
  const [reviews, setReviews] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [loadedUserId, setLoadedUserId] = useState(undefined) // 마지막으로 불러오기를 끝낸 사용자 (undefined = 아직 한 번도 안 끝남)
  const [levelIndexByUserId, setLevelIndexByUserId] = useState(null) // 계정 모드: 서버가 계산한 작성자 레벨
  const [gameSettings, setGameSettings] = useState(null) // 계정 모드: 서버의 하루 EXP 상한 등
  // 계정 모드: 빵집별 평균 별점 · 리뷰 개수 (서버 집계). 로컬 모드는 쓰지 않아요(status 'off').
  const [ratingStats, setRatingStats] = useState(null)
  const [ratingStatsStatus, setRatingStatsStatus] = useState(IS_ACCOUNT_MODE ? 'loading' : 'off')

  const reload = useCallback(() => {
    if (IS_ACCOUNT_MODE && getBackendConfigProblem()) {
      return Promise.resolve().then(() => {
        setRatingStatsStatus('error')
        setLoaded(true)
      })
    }
    return Promise.all([
      reviewRepository.list(),
      reviewRepository.listLevels?.() ?? null,
      reviewRepository.getSettings?.() ?? null,
      // 별점 집계를 못 가져와도 리뷰 불러오기 전체가 실패하지 않게 따로 감싸요 (그 경우 화면은 불러온 리뷰로 대신 계산해요)
      reviewRepository.listRatingStats
        ? reviewRepository.listRatingStats().then((value) => ({ ok: true, value }), () => ({ ok: false }))
        : null,
    ])
      .then(([items, levels, settings, ratingResult]) => {
        setReviews(items)
        if (levels) setLevelIndexByUserId(levels)
        if (settings) setGameSettings(settings)
        if (ratingResult) {
          setRatingStats(ratingResult.ok ? ratingResult.value : null)
          setRatingStatsStatus(ratingResult.ok ? 'ready' : 'error')
        }
        setLoadError(null)
      })
      .catch((error) => {
        // 계정 모드에서 불러오기에 실패해도 로컬 기록으로 바꿔치기하지 않아요
        setLoadError(error.message)
        setRatingStatsStatus((previous) => (previous === 'loading' ? 'error' : previous))
      })
      .finally(() => setLoaded(true))
  }, [])

  // 로그인 · 로그아웃이 바뀌면 (내 리뷰가 달라지므로) 다시 불러와요
  useEffect(() => {
    let isCurrent = true
    reload().then(() => {
      if (isCurrent) setLoadedUserId(userId)
    })
    // 로컬 모드: 다른 탭에서 리뷰를 쓰면 이 탭에도 반영돼요
    const unsubscribe = reviewRepository.subscribe(reload)
    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [reload, userId])

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

  // 작성자 레벨 객체 (계정 모드에서만. 로컬 모드는 화면이 리뷰로 직접 계산해요)
  const levelsByUserId = useMemo(
    () =>
      levelIndexByUserId
        ? Object.fromEntries(Object.entries(levelIndexByUserId).map(([id, index]) => [id, LEVELS[index] ?? LEVELS[0]]))
        : null,
    [levelIndexByUserId],
  )

  const value = useMemo(
    () => ({ reviews, loaded, loadError, loadedUserId, levelsByUserId, gameSettings, ratingStats, ratingStatsStatus, reload, createReview, updateReview, removeReview }),
    [reviews, loaded, loadError, loadedUserId, levelsByUserId, gameSettings, ratingStats, ratingStatsStatus, reload, createReview, updateReview, removeReview],
  )

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
}
