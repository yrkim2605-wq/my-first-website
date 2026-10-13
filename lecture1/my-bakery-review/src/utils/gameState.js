import { EXP_RULES, QUESTS } from '../constants/gameRules'
import { getLevelProgress } from './levelUtils'

// 게임 상태 계산: 저장된 리뷰(한 사용자의 것)만 있으면 EXP · 레벨 · 퀘스트 · 도감이 모두 정해져요.
// 순수 함수라서 화면과 상관없이 테스트할 수 있어요.

// 리뷰에서 통계를 뽑아요. 도감(발견)은 카카오 빵집만 세요 (샘플 빵집은 도감에 없어요).
export const computeStats = (reviews) => {
  const bakeryIds = new Set(reviews.map((review) => review.bakeryId))
  const districtIds = new Set(reviews.map((review) => review.districtId).filter(Boolean))
  const discoveredBakeryIds = new Set(
    reviews.filter((review) => review.bakerySource === 'kakao').map((review) => review.bakeryId),
  )
  return {
    reviewCount: reviews.length,
    photoReviewCount: reviews.filter((review) => review.photo).length,
    bakeryCount: bakeryIds.size,
    districtCount: districtIds.size,
    discoveredBakeryIds,
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
