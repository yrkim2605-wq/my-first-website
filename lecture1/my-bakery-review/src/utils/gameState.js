import { DAILY_EXP_CAP, DAILY_REVIEW_LIMIT, EXP_RULES, QUESTS } from '../constants/gameRules'
import { getLevelProgress } from './levelUtils'

// 게임 상태 계산: 저장된 리뷰(한 사용자의 것)만 있으면 EXP · 레벨 · 퀘스트 · 도감이 모두 정해져요.
// 순수 함수라서 화면과 상관없이 테스트할 수 있어요.

// 리뷰에서 통계를 뽑아요. 도감(발견)은 카카오 빵집만 세요 (샘플 빵집은 도감에 없어요).
//
// EXP · 퀘스트에는 "EXP를 받은 리뷰"만 써요. 계정 모드(Supabase)에서는 서버가 리뷰마다 expReview / expPhoto를
// 정해서 내려주고(하루 EXP 상한을 넘으면 false), 로컬 리뷰에는 그 칸이 없으니 모두 EXP 대상으로 봐요.
// 도감(발견)과 "모험 일지 N개" 표시는 EXP 상한과 상관없이 쓴 리뷰 전체로 세요.
// (서버의 user_stats 뷰와 같은 계산이에요 → supabase/tests/exp-parity.test.mjs가 둘이 같은지 확인해요.)
export const computeStats = (reviews) => {
  const counted = reviews.filter((review) => review.expReview !== false)
  const bakeryIds = new Set(counted.map((review) => review.bakeryId))
  const districtIds = new Set(counted.map((review) => review.districtId).filter(Boolean))
  const discoveredBakeryIds = new Set(
    reviews.filter((review) => review.bakerySource === 'kakao').map((review) => review.bakeryId),
  )
  return {
    allReviewCount: reviews.length,
    reviewCount: counted.length,
    photoReviewCount: counted.filter((review) => review.photo && review.expPhoto !== false).length,
    bakeryCount: bakeryIds.size,
    districtCount: districtIds.size,
    discoveredBakeryIds,
  }
}

// ── 하루 EXP 상한 (계정 모드) ──
// 서버 트리거(reviews_before_insert)와 같은 규칙으로 "지금 새 리뷰를 쓰면 EXP를 받는지"를 미리 계산해요.
// 진짜 지급은 서버가 정하고, 이 계산은 저장 전 미리보기 · 안내 문구용이에요.
const DEFAULT_SETTINGS = { dailyExpCap: DAILY_EXP_CAP, reviewExp: EXP_RULES.review, photoExp: EXP_RULES.reviewPhoto }

// 한국 시간 기준 날짜 ("2026-10-14")
export const kstDate = (value) => new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

// 오늘(한국 시간) 이미 받은 리뷰 · 사진 EXP
export const expUsedToday = (myReviews, settings = DEFAULT_SETTINGS, now = new Date()) => {
  const today = kstDate(now)
  const todays = myReviews.filter((review) => review.createdAt && kstDate(review.createdAt) === today)
  return (
    todays.filter((review) => review.expReview === true).length * settings.reviewExp +
    todays.filter((review) => review.expPhoto === true && review.photo).length * settings.photoExp
  )
}

export const reviewsWrittenToday = (myReviews, now = new Date()) => {
  const today = kstDate(now)
  return myReviews.filter((review) => review.createdAt && kstDate(review.createdAt) === today).length
}

// 새 리뷰를 쓰면 { expReview, expPhoto, limitReached(하루 작성 상한) }가 어떻게 되는지
export const predictNewReviewExp = (myReviews, { hasPhoto = false, settings = DEFAULT_SETTINGS, now = new Date() } = {}) => {
  const left = Math.max(settings.dailyExpCap - expUsedToday(myReviews, settings, now), 0)
  const expReview = left >= settings.reviewExp
  return {
    expReview,
    expPhoto: expReview && hasPhoto && left >= settings.reviewExp + settings.photoExp,
    expLeft: left,
    limitReached: reviewsWrittenToday(myReviews, now) >= DAILY_REVIEW_LIMIT,
  }
}

export const computeQuests = (stats) =>
  QUESTS.map((quest) => {
    const current = Math.min(stats[quest.stat], quest.target)
    return {
      ...quest,
      current,
      done: stats[quest.stat] >= quest.target,
      percent: Math.round((current / quest.target) * 100),
    }
  })

// EXP 내역: 리뷰 EXP + 사진 EXP + 완료한 퀘스트 보너스
export const computeExp = (stats, quests) => {
  const reviewExp = stats.reviewCount * EXP_RULES.review
  const photoExp = stats.photoReviewCount * EXP_RULES.reviewPhoto
  const questExp = quests.filter((quest) => quest.done).reduce((sum, quest) => sum + quest.bonusExp, 0)
  return { reviewExp, photoExp, questExp, total: reviewExp + photoExp + questExp }
}

export const buildGameState = (reviews) => {
  const stats = computeStats(reviews)
  const quests = computeQuests(stats)
  const expBreakdown = computeExp(stats, quests)
  return {
    stats,
    quests,
    expBreakdown,
    exp: expBreakdown.total,
    progress: getLevelProgress(expBreakdown.total),
  }
}

// 리뷰를 저장하기 전 / 후 상태를 비교해서 "무엇을 얼마나 얻었는지"를 알려줘요 (보상 화면용).
// events: 화면에 줄 단위로 보여줄 내역, leveledUp: 레벨이 올랐는지
export const diffGameState = (before, after) => {
  const events = []
  const reviewDelta = after.expBreakdown.reviewExp - before.expBreakdown.reviewExp
  const photoDelta = after.expBreakdown.photoExp - before.expBreakdown.photoExp
  if (reviewDelta !== 0) events.push({ id: 'review', label: '모험 일지 작성', exp: reviewDelta })
  if (photoDelta !== 0) events.push({ id: 'photo', label: '사진 첨부', exp: photoDelta })

  const beforeDone = new Set(before.quests.filter((quest) => quest.done).map((quest) => quest.id))
  after.quests
    .filter((quest) => quest.done && !beforeDone.has(quest.id))
    .forEach((quest) => events.push({ id: quest.id, label: `퀘스트 완료 · ${quest.title}`, exp: quest.bonusExp, isQuest: true }))

  return {
    events,
    expGained: after.exp - before.exp,
    leveledUp: after.progress.currentIndex > before.progress.currentIndex,
    levelBefore: before.progress.currentLevel,
    levelAfter: after.progress.currentLevel,
  }
}

// 리뷰 목록에서 사용자(userId)마다 현재 레벨을 계산해요. 리뷰 카드의 작성자 레벨 표시에 써요.
export const buildLevelsByUser = (reviews) => {
  const grouped = new Map()
  reviews.forEach((review) => {
    grouped.set(review.userId, [...(grouped.get(review.userId) ?? []), review])
  })
  const levels = {}
  grouped.forEach((userReviews, userId) => {
    levels[userId] = buildGameState(userReviews).progress.currentLevel
  })
  return levels
}
