// 히어로와 두 번째 섹션이 함께 쓰는 원형 텍스트 설정
export const CIRCLE_TEXT_PROPS = {
  text: 'TURNING EVERY IDEA INTO A VISUAL EXPERIENCE THAT CONNECTS PEOPLE, STORIES AND BRANDS. ',
  size: 380,
  fontSize: 34, // 명세 30px(1440 기준)에 맞춘 값 — 히어로 원(23cqw) 기준
  color: '#111111',
  duration: 30,
  reverse: true,
};

// MUI md 브레이크포인트(900px) 이상인지
export const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;
