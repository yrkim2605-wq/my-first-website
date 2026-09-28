// 자기소개 페이지 공통 값 (시안 1440 × 784 기준)
export const ABOUT_SECTIONS = [
  // isReady: 내용이 완성된 섹션만 점·화살표로 이동할 수 있다
  { id: 'about-01', label: '01', isReady: true },
  { id: 'about-02', label: '02', isReady: true },
  { id: 'about-03', label: '03', isReady: false },
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

export const aboutStageProps = {
  ratio: [1440, 784],
  sx: { bgcolor: '#000000', height: '100svh' },
  stageSx: { aspectRatio: '1440 / 784', overflow: 'hidden' },
};
