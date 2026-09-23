import { LEVELS } from '../constants/levels'

export const calculateLevel = (visitedCount, totalHearts) => {
  for (let i = LEVELS.length - 1; i >= 0; i -= 1) {
    const level = LEVELS[i]
    if (visitedCount >= level.minVisits && totalHearts >= level.minHearts) {
      return level
    }
  }
  return LEVELS[0]
}

export const getLevelProgress = (visitedCount, totalHearts) => {
  const currentLevel = calculateLevel(visitedCount, totalHearts)
  const currentIndex = LEVELS.findIndex((level) => level.id === currentLevel.id)
  const nextLevel = LEVELS[currentIndex + 1]

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      percent: 100,
      isMaxLevel: true,
      visitsNeeded: 0,
      heartsNeeded: 0,
    }
  }

  const visitRatio = nextLevel.minVisits > 0 ? visitedCount / nextLevel.minVisits : 1
  const heartRatio = nextLevel.minHearts > 0 ? totalHearts / nextLevel.minHearts : 1
  const percent = Math.round(Math.min(visitRatio, heartRatio, 1) * 100)

  return {
    currentLevel,
    nextLevel,
    percent,
    isMaxLevel: false,
    visitsNeeded: Math.max(nextLevel.minVisits - visitedCount, 0),
    heartsNeeded: Math.max(nextLevel.minHearts - totalHearts, 0),
  }
}
