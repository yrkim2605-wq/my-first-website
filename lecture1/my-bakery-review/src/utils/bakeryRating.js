// 빵집 평균 별점 · 리뷰 개수를 화면용으로 정리해요 (계정 모드에서만 써요. 로컬 모드는 예전 방식 그대로예요).
//
// 숫자의 출처
//  1) 서버 집계(ranking_bakeries 뷰): 모든 사용자의 리뷰로 계산한 평균(소수점 첫째 자리)과 개수. 가장 정확해요.
//  2) 서버 집계를 못 가져왔을 때: 지금 불러온 리뷰로 직접 계산해요 (최신 500개 + 내 리뷰라서 일부일 수 있어요).
// 리뷰가 0개인 빵집은 0점이 아니라 "별점 없음"(status: 'empty')이에요.

export const roundToOneDecimal = (value) => Math.round(value * 10) / 10

// 리뷰 목록으로 빵집 하나의 평균을 계산해요 (소수점 첫째 자리, 서버의 round(avg(rating), 1)과 같은 반올림이에요).
// 별점은 0.5 단위라서 "별점 x 2"의 정수 합으로 계산하면 부동소수점 오차 없이 서버와 똑같이 반올림돼요.
export const averageOfReviews = (reviews, bakeryId) => {
  const key = String(bakeryId)
  const ratings = reviews.filter((review) => String(review.bakeryId) === key).map((review) => Number(review.rating)).filter(Number.isFinite)
  const n = ratings.length
  if (n === 0) return { average: 0, count: 0 }
  const halves = ratings.map((rating) => Math.round(rating * 2))
  const isHalfStep = ratings.every((rating, index) => Math.abs(rating * 2 - halves[index]) < 1e-9)
  if (!isHalfStep) return { average: roundToOneDecimal(ratings.reduce((sum, rating) => sum + rating, 0) / n), count: n }
  const sumOfHalves = halves.reduce((sum, half) => sum + half, 0)
  // 평균 = sumOfHalves / (2n). 소수점 첫째 자리로 "반올림(0.05는 올림)": floor((10 * sumOfHalves + n) / (2n)) / 10
  return { average: Math.floor((10 * sumOfHalves + n) / (2 * n)) / 10, count: n }
}

// status: 'loading'(아직 모름) | 'empty'(리뷰 없음) | 'ready'(평균 있음) | 'error'(불러오지 못함: 리뷰 0개와 달라요) | 'off'(로컬 모드: 이 값을 쓰지 않아요)
export const getBakeryRatingInfo = ({ isAccountMode, stats, statsStatus, reviews, reviewsLoaded, reviewsError = null, bakeryId }) => {
  if (!isAccountMode) return { status: 'off', average: 0, count: 0, source: null }
  const key = String(bakeryId)
  let found = null
  let source = null
  if (stats) {
    // 서버 집계에 없는 빵집 = 리뷰가 0개
    found = stats[key] ?? { average: 0, count: 0 }
    source = 'server'
  } else if (statsStatus === 'error') {
    // 서버 집계도 리뷰 목록도 못 가져왔으면 "리뷰 없음"이 아니라 "불러오지 못함"이에요
    if (reviewsError || !reviewsLoaded) return { status: reviewsLoaded ? 'error' : 'loading', average: 0, count: 0, source: null }
    found = averageOfReviews(reviews, key)
    source = 'loaded-reviews'
  }
  if (!found) return { status: 'loading', average: 0, count: 0, source: null }
  return found.count > 0 ? { status: 'ready', average: found.average, count: found.count, source } : { status: 'empty', average: 0, count: 0, source }
}

// "4.3" 같은 한 자리 소수 문자열
export const formatAverage = (average) => Number(average).toFixed(1)
