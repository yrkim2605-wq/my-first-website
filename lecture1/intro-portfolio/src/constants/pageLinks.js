// 페이지 주소 — 양옆 이전·다음 링크(components/EdgeNav)가 쓴다
// 페이지를 한 줄로 이어 둔다: MAIN → ABOUT ME → DR.JART+ → AI INFLUENCER → ILLUSTRATION → MAIN
const BASE = import.meta.env.BASE_URL;

export const PAGE_LINKS = {
  main: { label: 'MAIN', href: BASE },
  about: { label: 'ABOUT ME', href: `${BASE}about.html` },
  drjart: { label: 'DR.JART+', href: `${BASE}project-drjart.html` },
  ai: { label: 'AI INFLUENCER', href: `${BASE}project-ai.html` },
  illustration: { label: 'ILLUSTRATION', href: `${BASE}project-illustration.html` },
};
