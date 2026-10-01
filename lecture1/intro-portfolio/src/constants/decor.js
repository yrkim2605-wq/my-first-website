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

// 로딩 인트로(components/IntroLoader) — 탭마다 처음 한 번만 보여 준다
const INTRO_SEEN_KEY = 'introSeen';
const INTRO_SECONDS = 1.05; // 인트로가 걷히기 시작하는 때 — 히어로 등장 연출을 이만큼 늦춘다

const hasSeenIntro = () => {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return true; // 저장소를 못 쓰면 매번 기다리게 하지 않도록 본 것으로 친다
  }
};

// 페이지를 여는 순간 한 번 정한다 — 이번 방문에 인트로를 보여 줄지
export const showIntro =
  !hasSeenIntro() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const markIntroSeen = () => {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    // 저장하지 못해도 이번 화면엔 영향이 없다
  }
};

const introOffset = showIntro ? INTRO_SECONDS : 0;

// 히어로 첫 등장 연출 — 사이트에 처음 들어왔을 때 한 번 재생된다 (키프레임은 index.css)
// name: heroRevealUp(큰 글자) · heroPopIn(리본·큐브·원형 글자) · heroDropIn(헤더)
// 로딩 인트로가 있으면 그게 걷힐 때에 맞춰 시작한다
// '동작 줄이기' 사용자에겐 재생하지 않는다
export const heroIntroSx = (name, delay, duration = 1.3) => ({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${name} ${duration}s cubic-bezier(0.77, 0, 0.18, 1) ${delay + introOffset}s both`,
  },
});
