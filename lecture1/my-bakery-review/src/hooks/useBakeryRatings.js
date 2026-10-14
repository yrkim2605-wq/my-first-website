import { useCallback } from 'react'
import { useReviews } from './useReviews'
import { IS_ACCOUNT_MODE } from '../lib/backend'
import { getBakeryRatingInfo } from '../utils/bakeryRating'

// 빵집의 평균 별점 · 리뷰 개수를 알려주는 hook이에요 (목록 · 상세 · 지도 카드가 모두 이걸 써서 같은 숫자가 보여요).
// 계정 모드: 서버 집계(모든 사용자의 리뷰)를 써요. 리뷰를 쓰거나 고치거나 지우면 ReviewsContext가 다시 불러와서 바로 갱신돼요.
// 로컬 모드: status가 'off'라서 화면이 예전 방식 그대로 동작해요.
export const useBakeryRatings = () => {
  const { reviews, loaded, loadError, ratingStats, ratingStatsStatus } = useReviews()
  const getRating = useCallback(
    (bakeryId) => getBakeryRatingInfo({ isAccountMode: IS_ACCOUNT_MODE, stats: ratingStats, statsStatus: ratingStatsStatus, reviews, reviewsLoaded: loaded, reviewsError: loadError, bakeryId }),
    [reviews, loaded, loadError, ratingStats, ratingStatsStatus],
  )
  return { isEnabled: IS_ACCOUNT_MODE, getRating }
}
