import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { useReviews } from './useReviews'
import { buildGameState } from '../utils/gameState'

// 지금 프로필의 게임 상태 (EXP · 레벨 · 퀘스트 · 도감). 로그인하지 않았으면 Lv.1, EXP 0이에요.
export const useGameState = () => {
  const { profile } = useProfile()
  const { reviews, loaded } = useReviews()

  const myReviews = useMemo(
    () => (profile ? reviews.filter((review) => review.userId === profile.userId) : []),
    [profile, reviews],
  )
  const state = useMemo(() => buildGameState(myReviews), [myReviews])

  return { ...state, profile, myReviews, loaded }
}
