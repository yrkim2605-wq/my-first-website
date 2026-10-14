import { LEVELS } from '../constants/levels'

// 서버가 준 시각(ISO)을 한국 날짜(예: 2026-10-14)로 보여줘요. 예시 글의 날짜 모양과 같아요.
const KOREA_DATE = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })

export const formatPostDate = (isoString) => {
  const time = new Date(isoString)
  return Number.isNaN(time.getTime()) ? '' : KOREA_DATE.format(time)
}

// 글을 고친 적이 있는지 (작성 직후의 몇 초 차이는 고친 것으로 보지 않아요)
export const isEdited = (post) => new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 5000

// 서버가 계산한 레벨 번호(0~4) → 레벨 정보. 범위를 벗어나면 가장 낮은 레벨이에요.
export const levelFromIndex = (levelIndex) => LEVELS[levelIndex] ?? LEVELS[0]
