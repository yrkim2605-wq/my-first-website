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

// 히어로 첫 등장 연출 — 사이트에 처음 들어왔을 때 한 번 재생된다 (키프레임은 index.css)
// name: heroRevealUp(큰 글자) · heroPopIn(리본·큐브·원형 글자) · heroDropIn(헤더)
// '동작 줄이기' 사용자에겐 재생하지 않는다
export const heroIntroSx = (name, delay, duration = 1.3) => ({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${name} ${duration}s cubic-bezier(0.77, 0, 0.18, 1) ${delay}s both`,
  },
});
