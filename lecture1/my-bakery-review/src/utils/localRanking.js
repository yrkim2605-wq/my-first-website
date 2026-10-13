import { buildGameState } from './gameState'

// 이 브라우저에 저장된 프로필 · 리뷰로 실제 순위를 계산해요 (예시 데이터 없이, 저장된 기록만 써요).
// 일지를 1개 이상 남긴 프로필만 순위에 올라요. EXP가 같으면 일지 수, 그다음 먼저 가입한 순이에요.
export const buildLocalRanking = (profiles, reviews) =>
  profiles
    .map((profile) => {
      const myReviews = reviews.filter((review) => review.userId === profile.userId)
      const game = buildGameState(myReviews)
      return {
        userId: profile.userId,
        nickname: profile.nickname,
        createdAt: profile.createdAt,
        exp: game.exp,
        reviewCount: game.stats.reviewCount,
        discoveredCount: game.stats.discoveredBakeryIds.size,
        levelIndex: game.progress.currentIndex,
        level: game.progress.currentLevel,
      }
    })
    .filter((entry) => entry.reviewCount > 0)
    .sort((a, b) => b.exp - a.exp || b.reviewCount - a.reviewCount || (a.createdAt < b.createdAt ? -1 : 1))
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
