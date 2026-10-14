import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { useReviews } from './useReviews'
import { buildGameState } from '../utils/gameState'
import { IS_ACCOUNT_MODE } from '../lib/backend'
import { getReviewLoadStatus } from '../utils/reviewLoadStatus'

// 지금 프로필의 게임 상태 (EXP · 레벨 · 퀘스트 · 도감). 로그인하지 않았으면 Lv.1, EXP 0이에요.
// 계정 모드에서 로그인한 상태라면 서버에서 내 기록을 다 불러오기 전(isLoading)이나 불러오기에 실패했을 때(loadError)는
// 값이 "0 EXP · Lv.1"로 잘못 보이지 않도록, 화면이 이 두 값을 보고 안내를 보여줘요. (reloadReviews = 다시 불러오기)
export const useGameState = () => {
  const { profile } = useProfile()
  const { reviews, loaded, loadError, loadedUserId, reload } = useReviews()

  const myReviews = useMemo(
    () => (profile ? reviews.filter((review) => review.userId === profile.userId) : []),
    [profile, reviews],
  )
  const state = useMemo(() => buildGameState(myReviews), [myReviews])

  const status = getReviewLoadStatus({ isAccountMode: IS_ACCOUNT_MODE, userId: profile?.userId ?? null, loaded, loadedUserId, loadError })

  return { ...state, profile, myReviews, loaded, ...status, reloadReviews: reload }
}
