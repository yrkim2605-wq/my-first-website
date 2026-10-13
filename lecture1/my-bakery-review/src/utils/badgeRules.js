import { BADGES } from '../constants/badges'

// 저장된 일지(한 사용자의 것)로 배지를 판정해요. 순수 함수라서 화면과 상관없이 테스트할 수 있어요.
// 돌려주는 값: [{ ...badge, current, target, earned }]
export const evaluateBadges = (reviews, discoveredCount) =>
  BADGES.map((badge) => {
    const { rule } = badge
    const raw =
      rule.type === 'keyword'
        ? reviews.filter((review) => review.content.includes(rule.keyword)).length
        : discoveredCount
    return { ...badge, current: Math.min(raw, rule.target), target: rule.target, earned: raw >= rule.target }
  })
