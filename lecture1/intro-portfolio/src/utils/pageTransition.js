// 다른 페이지로 넘어갈 때 화면을 검게 덮은 뒤 이동한다 (메인 ↔ 자기소개)
// 브라우저의 View Transition은 개발 서버에서 CSS가 늦게 붙으면 중간에 취소되며 이동이 막힐 수 있어,
// 모든 브라우저에서 똑같이 동작하는 이 방식을 쓴다.
const FADE_MS = 450;
const COVER_CLASS = 'pageCover';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const navigateWithFade = (go) => {
  if (prefersReducedMotion()) {
    go();
    return;
  }
  if (document.querySelector(`.${COVER_CLASS}`)) return; // 이미 이동 중이면 연타를 무시한다

  const cover = document.createElement('div');
  cover.className = COVER_CLASS;
  document.body.appendChild(cover);
  cover.getBoundingClientRect(); // 처음 상태(투명)를 먼저 그리게 해야 서서히 어두워진다
  cover.classList.add('isVisible');
  window.setTimeout(go, FADE_MS);
};

// 뒤로가기로 돌아오면 브라우저가 떠나기 직전 화면(검은 막 포함)을 그대로 되살리므로, 막을 서서히 걷어낸다
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.querySelectorAll(`.${COVER_CLASS}`).forEach((cover) => {
    cover.classList.remove('isVisible');
    window.setTimeout(() => cover.remove(), FADE_MS);
  });
});
