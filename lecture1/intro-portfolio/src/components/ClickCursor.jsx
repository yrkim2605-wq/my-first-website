import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import '@fontsource/alumni-sans/900.css'; // 고리 글자 전용 굵기 — 작은 글자라 굵어야 또렷하다
import CircularText from './CircularText';
import { INK, POINT_LIME as LIME } from '../constants/colors';

// 프로젝트 썸네일 위에서만 나타나는 회전 원형 글자 커서 — 둘레엔 CLICK · VIEW PROJECT가 돌고, 가운데엔 ↗ 화살표
// 흑백 사이트에서 커서만 라임색 — 어느 썸네일(초록·분홍·노랑·파랑) 위에서도 겹치지 않아 또렷하고, 사이트의 포인트 색이 된다
// data-click-cursor가 붙은 요소 위에 마우스가 오면 커서 자리에서 동그라미가 커지며 나타나고, 벗어나면 줄어들며 사라진다
// (그 요소에선 기본 커서를 숨긴다 — Projects의 ProjectCard)
// 마우스는 그대로인데 스크롤로 카드가 바뀌어도 알맞게 나타나고 사라진다
// 마우스를 살짝 늦게 따라오며, 빠르게 움직이면 움직이는 쪽으로 쫀득하게 늘어났다가 멈추면 다시 동그래진다
// 터치 기기(마우스 없음)에선 아무것도 하지 않고, '동작 줄이기' 사용자에겐 늘어나지 않고 바로 따라붙는다

const SIZE = 112; // px — 바깥 원(글자 고리) 지름
const DOT = 38; // px — 가운데 점 지름
const RING_TEXT = 'CLICK · VIEW PROJECT · CLICK · VIEW PROJECT · ';
const FOLLOW = 0.15; // 따라오는 빠르기 (1이면 바로) — 작을수록 더 늦게, 더 쫀득하게 따라온다
const STRETCH_PER_PX = 0.03; // 한 프레임에 1px 움직일 때 늘어나는 정도 — 보통 속도로 움직여도 1.15~1.3배는 늘어나야 눈에 띈다
const MAX_STRETCH = 0.5; // 가장 많이 늘어날 때 1.5배 — 멈추면 바로 동그래지니 순간적으로는 이 정도까지 괜찮다

const ClickCursor = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = ref.current;
    const mouse = { x: -SIZE, y: -SIZE };
    const point = { x: -SIZE, y: -SIZE }; // 커서가 지금 그려지는 자리 (마우스를 늦게 따라간다)
    let stretch = 0;
    let angle = 0;
    let isVisible = false;
    let raf = 0;

    const update = (target) => {
      const isOver = target instanceof Element && !!target.closest('[data-click-cursor]');
      if (isOver && !isVisible) {
        // 나타날 땐 멀리서 날아오지 않게 바로 마우스 자리에 둔다
        point.x = mouse.x;
        point.y = mouse.y;
      }
      isVisible = isOver;
      el.classList.toggle('isVisible', isOver);
    };
    const handleMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      update(event.target);
    };
    const handleScroll = () => update(document.elementFromPoint(mouse.x, mouse.y));
    const handleLeave = () => update(null);

    const tick = () => {
      const follow = reduceMotion ? 1 : FOLLOW;
      const dx = (mouse.x - point.x) * follow;
      const dy = (mouse.y - point.y) * follow;
      point.x += dx;
      point.y += dy;

      // 이번 프레임에 움직인 만큼 늘어나되, 갑자기 튀지 않게 부드럽게 바꾼다
      const speed = Math.hypot(dx, dy);
      const target = reduceMotion ? 0 : Math.min(speed * STRETCH_PER_PX, MAX_STRETCH);
      stretch += (target - stretch) * 0.25;
      if (speed > 0.5) angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // 움직이는 방향으로 돌려 늘리고 다시 되돌려, 원 안의 글자·화살표 방향은 그대로 둔다
      el.style.transform =
        `translate3d(${point.x - SIZE / 2}px, ${point.y - SIZE / 2}px, 0) ` +
        `rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.5}) rotate(${-angle}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        width: SIZE,
        height: SIZE,
        pointerEvents: 'none',
        // 안쪽만 커지고 작아진다 — 바깥 상자는 마우스 위치만 따라간다
        // 나타날 땐 반 바퀴 덜 돈 자리에서 돌아 들어오며 커진다
        '& .clickInner': {
          position: 'relative',
          borderRadius: '50%',
          bgcolor: LIME,
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.25)',
          width: '100%',
          height: '100%',
          scale: '0',
          rotate: '-120deg',
          transition: 'scale 0.35s cubic-bezier(0.22, 1, 0.36, 1), rotate 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        },
        '&.isVisible .clickInner': { scale: '1', rotate: '0deg' },
      }}
    >
      <Box className="clickInner">
        {/* 둘레를 천천히 도는 글자 — 히어로의 원형 글자와 같은 컴포넌트 */}
        <CircularText
          text={RING_TEXT}
          size={SIZE}
          fontSize={14}
          fontWeight={900}
          color={INK}
          duration={8}
          fit
        />
        {/* 가운데 점 + 프로젝트로 넘어간다는 화살표 */}
        <Box
          sx={{
            position: 'absolute',
            inset: '50%',
            width: DOT,
            height: DOT,
            m: `${-DOT / 2}px`,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: INK,
          }}
        >
          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 18, height: 18 }}>
            <path d="M7 17 L17 7 M9 7 H17 V15" fill="none" stroke={LIME} strokeWidth="2.4" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ClickCursor;
