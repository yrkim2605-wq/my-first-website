import { dpx, mpx } from '../../constants/typography';

// 자기소개 페이지 공통 값 (시안 1440 × 784 기준)
export const ABOUT_SECTIONS = [
  // isReady: 내용이 완성된 섹션만 점·화살표로 이동할 수 있다
  { id: 'about-01', label: '01', isReady: true },
  { id: 'about-02', label: '02', isReady: true },
  { id: 'about-03', label: '03', isReady: true },
  { id: 'about-04', label: '04', isReady: false },
];

export const aboutTextSx = {
  fontFamily: '"Alumni Sans", sans-serif',
  fontWeight: 600,
  color: '#ffffff',
  lineHeight: 1,
};

// 한글 문장용 — Inter에 없는 한글은 시스템 고딕으로 보인다
export const aboutKoreanSx = {
  fontFamily: '"Inter", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
  letterSpacing: '-0.02em',
};

// 데스크톱: 1440 × 784 무대를 창에 맞춰 줄인다
// 모바일: 무대가 화면 너비를 꽉 채우고, 높이는 mobileAspect(예: '390 / 780')로 정하거나
//   'auto'면 안의 글 흐름만큼 늘어난다 — 화면보다 짧아도 최소 한 화면 높이는 차지한다
export const aboutStageProps = (isMobile, mobileAspect = 'auto') => ({
  ratio: [1440, 784],
  sx: { bgcolor: '#000000', height: isMobile ? 'auto' : '100svh', minHeight: isMobile ? '100svh' : 0 },
  stageSx: { aspectRatio: isMobile ? mobileAspect : '1440 / 784', overflow: 'hidden' },
});

// 모바일 글 흐름의 좌우 여백, 아래 여백(화면 아래 BACK 버튼에 글이 가리지 않게)
export const MOBILE_GUTTER = 20;
export const MOBILE_BOTTOM_SPACE = 72;

// 데스크톱이면 시안 좌표(desktopSx)에 띄워 놓고, 모바일이면 글 흐름 안에 둔다(mobileSx)
export const placeSx = (isMobile, desktopSx, mobileSx = {}) =>
  isMobile ? mobileSx : { position: 'absolute', ...desktopSx };

// 모바일 글 흐름 껍데기 — 데스크톱에선 위치를 잡지 않아 안의 요소가 무대 기준으로 놓인다
export const mobileFlowSx = (isMobile) =>
  isMobile ? { display: 'flex', flexDirection: 'column', px: mpx(MOBILE_GUTTER), pt: mpx(84), pb: mpx(MOBILE_BOTTOM_SPACE) } : {};

// 번호 옆 구분선 — 데스크톱은 위에서부터 그어지는 세로선, 모바일은 번호 아래 왼쪽부터 그어지는 가로선
export const sectionDividerSx = (isMobile, isInView) => ({
  bgcolor: 'rgba(255, 255, 255, 0.3)',
  transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
  ...(isMobile
    ? { mt: mpx(24), height: '1px', transformOrigin: 'left', transform: isInView ? 'scaleX(1)' : 'scaleX(0)' }
    : {
        position: 'absolute',
        left: dpx(237),
        top: dpx(95),
        height: dpx(617),
        width: '1px',
        transformOrigin: 'top',
        transform: isInView ? 'scaleY(1)' : 'scaleY(0)',
      }),
  '@media (prefers-reduced-motion: reduce)': { transform: 'none', transition: 'none' },
});
