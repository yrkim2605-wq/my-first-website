// 디자인 명세(폰트 (1).pdf)는 1440px 너비 프레임 기준이다.
// dpx(70) → 무대 너비가 1440px일 때 70px, 화면 크기에 따라 같은 비율로 커지고 작아진다.
export const DESIGN_WIDTH = 1440;

export const dpx = (px) => `${+((px / DESIGN_WIDTH) * 100).toFixed(3)}cqw`;
