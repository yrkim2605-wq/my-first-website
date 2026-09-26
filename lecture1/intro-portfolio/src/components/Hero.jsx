import { useRef } from 'react';
import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import CircularText from './CircularText';
import RibbonBand from './RibbonBand';
import GlassCube from './GlassCube';
import FitStage from './FitStage';
import useScrollFrame from '../hooks/useScrollFrame';
import { CIRCLE_TEXT_PROPS, isDesktop } from '../constants/decor';

const bigDisplaySx = {
  position: 'absolute',
  fontFamily: '"Anton", sans-serif',
  fontWeight: 400,
  fontSize: { xs: '30cqw', md: dpx(300) },
  lineHeight: 1,
  letterSpacing: '-0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  willChange: 'transform',
};

// IDEA 줄무늬 (참고: dayonedream.com의 DAY) — 단위: 글자 전체 너비의 %
// I와 D 앞부분은 완전 검정 → D 오른쪽 끝에서 머리카락 같은 흰 줄이 생기고
// → E가 시작될 즈음엔 또렷한 줄무늬 → 오른쪽 끝(A)으로 갈수록 흰 줄이 점점 굵어진다
// 흰 줄은 배경색과 같아서 글자가 잘게 갈라진 것처럼 보인다
const STRIPE_PERIOD = 1.0; // 줄 간격
// [위치, 흰 줄 비율] — 사이 구간은 부드럽게 이어진다
const STRIPE_STOPS = [
  [22, 0], // D 가운데: 보이지 않을 만큼 가늘게 시작
  [46, 0.22], // E 시작: 또렷해짐
  [100, 0.65], // A 끝: 가장 굵게
];

const whiteRatio = (x) => {
  const [[xa, wa], [xb, wb], [xc, wc]] = STRIPE_STOPS;
  if (x <= xa) return 0;
  if (x >= xc) return wc;
  if (x >= xb) return wb + ((wc - wb) * (x - xb)) / (xc - xb);
  // 첫 구간: 기울기 0에서 천천히 시작해, 끝에선 다음 구간의 기울기와 같아지도록 이어 붙인다 (에르미트 곡선)
  const t = (x - xa) / (xb - xa);
  const endSlope = ((wc - wb) / (xc - xb)) * (xb - xa);
  return wa + (wb - wa) * (3 * t ** 2 - 2 * t ** 3) + endSlope * (t ** 3 - t ** 2);
};

const ideaStripes = (() => {
  const stops = [];
  for (let x0 = 0; x0 < 100; x0 += STRIPE_PERIOD) {
    const x1 = Math.min(x0 + STRIPE_PERIOD, 100);
    const edge = (x1 - STRIPE_PERIOD * whiteRatio(x0 + STRIPE_PERIOD / 2)).toFixed(2);
    stops.push(`#000 ${x0.toFixed(2)}%`, `#000 ${edge}%`, `#fff ${edge}%`, `#fff ${x1.toFixed(2)}%`);
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`;
})();

// 스크롤로 히어로가 빠져나가는 동안: IDEA는 왼쪽, MADE는 오른쪽으로 갈라지고 리본은 위로 떠오른다
const SPLIT_CQW = 30;
const RIBBON_RISE_CQW = 22;

const Hero = () => {
  const sectionRef = useRef(null);
  const ideaRef = useRef(null);
  const madeRef = useRef(null);
  const ribbonRef = useRef(null);

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return;
    const targets = [ideaRef.current, madeRef.current, ribbonRef.current];
    if (!isDesktop()) {
      targets.forEach((el) => el.style.removeProperty('transform'));
      return;
    }
    const rect = section.getBoundingClientRect();
    const p = Math.min(Math.max(-rect.top / rect.height, 0), 1);
    ideaRef.current.style.transform = `translateX(${-p * SPLIT_CQW}cqw)`;
    madeRef.current.style.transform = `translateX(${p * SPLIT_CQW}cqw)`;
    ribbonRef.current.style.transform = `translateY(${-p * RIBBON_RISE_CQW}cqw) scale(${1 + p * 0.15})`;
  });

  return (
    <FitStage
      id="home"
      ref={sectionRef}
      ratio={[1192, 600]}
      // 헤더(28px)와 위 여백(30px)을 뺀 만큼만 차지해 첫 화면에 딱 들어오게 한다
      height="calc(100svh - 58px)"
      sx={{ mt: '30px', bgcolor: '#ffffff' }}
      stageSx={{ overflow: 'hidden', aspectRatio: { xs: '4 / 5', md: '1192 / 600' } }}
    >
      {/* IDEA — 검정 글자에 오른쪽으로 갈수록 굵어지는 흰 세로 줄무늬 */}
      <Typography
        ref={ideaRef}
        component="h1"
        sx={{
          ...bigDisplaySx,
          left: '-1.2cqw',
          top: { xs: '4%', md: '7.3%' },
          color: 'transparent',
          backgroundImage: ideaStripes,
          backgroundSize: '100% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
      >
        IDEA
      </Typography>

      {/* MADE — 외곽선만 있는 글자 */}
      <Typography
        ref={madeRef}
        aria-hidden
        sx={{
          ...bigDisplaySx,
          left: { xs: '30%', md: '61%' },
          top: { xs: '58%', md: '41%' },
          color: 'transparent',
          WebkitTextStroke: '1px #111111',
        }}
      >
        MADE
      </Typography>

      {/* 큐브 자리 — 데스크톱에선 SharedDecor가 이 자리에 큐브를 그리고, 모바일에선 직접 그린다 */}
      <Box
        data-anchor="cube-hero"
        sx={{
          position: 'absolute',
          left: { xs: '8%', md: '6.5%' },
          top: { xs: '24%', md: '35%' },
          width: '8cqw',
          height: '8cqw',
          transform: { xs: 'scale(1.5)', md: 'none' },
          zIndex: 2,
        }}
      >
        <GlassCube sx={{ display: { xs: 'block', md: 'none' } }} />
      </Box>

      <Box
        ref={ribbonRef}
        sx={{
          position: 'absolute',
          left: { xs: '30%', md: '23%' },
          top: { xs: '16%', md: '6%' },
          transform: { xs: 'scale(1.35)', md: 'none' },
          width: '46cqw',
          height: '40cqw',
          zIndex: 1,
          willChange: 'transform',
        }}
      >
        <RibbonBand sx={{ width: '100%', height: '100%' }} />
      </Box>

      {/* 원형 텍스트 자리 — 큐브와 같은 방식 */}
      <Box
        data-anchor="circle-hero"
        sx={{
          position: 'absolute',
          left: { xs: '50%', md: '69.5%' },
          top: { xs: '60%', md: '44%' },
          width: { xs: '40cqw', md: '23cqw' },
          height: { xs: '40cqw', md: '23cqw' },
          zIndex: 3,
        }}
      >
        <CircularText
          {...CIRCLE_TEXT_PROPS}
          sx={{ display: { xs: 'block', md: 'none' }, width: '100%', height: '100%' }}
        />
      </Box>
    </FitStage>
  );
};

export default Hero;
