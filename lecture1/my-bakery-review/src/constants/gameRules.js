// 게임 규칙 상수예요. 경험치 · 퀘스트 숫자는 모두 여기서만 바꿔요.
//
// 원칙
// - 검증할 수 있는 활동(저장된 리뷰)에만 EXP를 줘요. "방문 체크"는 검증할 수 없어서 EXP가 없어요.
// - EXP는 저장된 리뷰에서 매번 계산해요 (별도 장부가 없어요). 그래서 새로고침이나 같은 리뷰로 중복 지급이 불가능해요.
//   리뷰를 지우면 그 리뷰의 EXP도 함께 사라져요.
// - 한 사용자는 한 빵집에 리뷰를 1개만 남길 수 있어서(고쳐 쓰기는 가능), 같은 빵집으로 EXP를 반복해서 얻을 수 없어요.

export const EXP_RULES = {
  review: 30, // 빵집 리뷰 1개
  reviewPhoto: 10, // 사진을 붙인 리뷰의 추가 EXP
}

// 계정 모드(Supabase)의 하루 EXP 상한과 하루 작성 상한이에요. 진짜 기준은 서버(game_settings 표)이고, 이 값은
// 서버 값을 못 읽었을 때의 기본값 · 저장 전 "예상 EXP" 미리보기용이에요. 서버 상한을 바꾸면 화면은 서버 값을 따라가요.
export const DAILY_EXP_CAP = 100
export const DAILY_REVIEW_LIMIT = 20

// 퀘스트: 실제 저장된 리뷰로 완료 여부를 확인할 수 있는 것만 만들어요.
// stat: gameState.computeStats가 계산하는 값의 이름, target: 완료에 필요한 값, bonusExp: 완료 보너스
export const QUESTS = [
  {
    id: 'first-review',
    title: '첫 모험 일지',
    description: '아무 빵집에나 첫 리뷰를 남겨요.',
    stat: 'reviewCount',
    target: 1,
    bonusExp: 20,
    unit: '개',
  },
  {
    id: 'explore-bakeries',
    title: '새로운 빵집 탐험',
    description: '서로 다른 빵집 3곳에 리뷰를 남겨요.',
    stat: 'bakeryCount',
    target: 3,
    bonusExp: 30,
    unit: '곳',
  },
  {
    id: 'explore-districts',
    title: '지역 탐험가',
    description: '서로 다른 지역 3곳의 빵집을 탐험해요.',
    stat: 'districtCount',
    target: 3,
    bonusExp: 50,
    unit: '곳',
  },
]
