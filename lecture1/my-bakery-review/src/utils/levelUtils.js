import { LEVELS } from '../constants/levels'

// 누적 EXP로 현재 레벨을 찾아요.
export const calculateLevel = (exp) => {
  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    if (exp >= LEVELS[i].minExp) return LEVELS[i]
  }
  return LEVELS[0]
}

// 누적 EXP로 레벨 진행 상황을 계산해요. 진행률(percent)은 "현재 레벨 구간 안에서" 얼마나 왔는지예요.
export const getLevelProgress = (rawExp) => {
  const exp = Math.max(0, Math.floor(rawExp))
  const currentLevel = calculateLevel(exp)
  const currentIndex = LEVELS.findIndex((level) => level.id === currentLevel.id)
  const nextLevel = LEVELS[currentIndex + 1] ?? null

  if (!nextLevel) {
    return {
      exp,
      currentLevel,
      currentIndex,
      nextLevel: null,
      percent: 100,
      isMaxLevel: true,
      expToNext: 0,
      expInLevel: exp - currentLevel.minExp,
      expSpan: 0,
    }
  }

  const expSpan = nextLevel.minExp - currentLevel.minExp
  const expInLevel = exp - currentLevel.minExp
  return {
    exp,
    currentLevel,
    currentIndex,
    nextLevel,
    percent: Math.round((expInLevel / expSpan) * 100),
    isMaxLevel: false,
    expToNext: nextLevel.minExp - exp,
    expInLevel,
    expSpan,
  }
}
