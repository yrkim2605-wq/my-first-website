import { LEVELS } from '../constants/levels'
import { TOP_VISITORS } from '../constants/ranking'

const LEVEL_BY_NAME = LEVELS.reduce((acc, level) => {
  acc[level.name] = level
  return acc
}, {})

// TOP_VISITORS의 levelName을 우선 사용하고, 랭킹 데이터에 없는 활동 회원은 캐릭터에 맞춰 수동으로 지정
const MANUAL_AUTHOR_LEVEL_NAME = {
  식빵요정: '빵탐험가',
  딸기덕후: '빵덕후',
  새벽러너: '빵전문가',
  소금빵마스터: '빵마스터',
}

const AUTHOR_LEVEL_BY_NICKNAME = {
  ...Object.fromEntries(
    TOP_VISITORS.map((visitor) => [visitor.nickname, LEVEL_BY_NAME[visitor.levelName]]),
  ),
  ...Object.fromEntries(
    Object.entries(MANUAL_AUTHOR_LEVEL_NAME).map(([nickname, levelName]) => [nickname, LEVEL_BY_NAME[levelName]]),
  ),
}

export const getAuthorLevel = (nickname) => AUTHOR_LEVEL_BY_NICKNAME[nickname] || LEVELS[0]
