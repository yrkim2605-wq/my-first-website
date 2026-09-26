import { useRef } from 'react';
import Box from '@mui/material/Box';
import GlassCube from './GlassCube';
import CircularText from './CircularText';
import useScrollFrame from '../hooks/useScrollFrame';
import { CIRCLE_TEXT_PROPS, isDesktop } from '../constants/decor';

// 히어로와 두 번째 섹션에 모두 나오는 큐브·원형 텍스트를 하나로 이어 준다 (참고: dayonedream.com)
// 두 섹션엔 보이지 않는 "자리(data-anchor)"만 두고, 실제 요소는 화면에 고정된 이 레이어에 그린다.
// 스크롤 진행도에 따라 히어로 자리 → 두 번째 섹션 자리로 위치·크기를 보간해, 요소가 날아가 앉는 것처럼 보인다.

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

const anchorRect = (name) => document.querySelector(`[data-anchor="${name}"]`)?.getBoundingClientRect();

const place = (el, name, t) => {
  const from = anchorRect(`${name}-hero`);
  const to = anchorRect(`${name}-about`);
  if (!el || !from || !to) return;
  const size = lerp(from.width, to.width, t);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.setProperty('--size', `${size}px`); // 큐브의 3D 깊이는 px 길이가 필요하다
  el.style.transform = `translate(${lerp(from.left, to.left, t)}px, ${lerp(from.top, to.top, t)}px)`;
};

const SharedDecor = () => {
  const cubeRef = useRef(null);
  const circleRef = useRef(null);

  useScrollFrame(() => {
    const about = document.getElementById('about');
    if (!about || !isDesktop()) return;
    // 두 번째 섹션 윗변이 화면 아래(0) → 화면 위(1)에 닿는 동안 이동한다
    const t = easeInOut(clamp(1 - about.getBoundingClientRect().top / window.innerHeight, 0, 1));
    place(cubeRef.current, 'cube', t);
    place(circleRef.current, 'circle', t);
  });

  return (
    <Box
      aria-hidden
      sx={{
        display: { xs: 'none', md: 'block' },
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    >
      <Box ref={cubeRef} sx={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}>
        <GlassCube size="var(--size, 0px)" />
      </Box>
      <Box ref={circleRef} sx={{ position: 'absolute', top: 0, left: 0, willChange: 'transform' }}>
        <CircularText {...CIRCLE_TEXT_PROPS} sx={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
};

export default SharedDecor;
