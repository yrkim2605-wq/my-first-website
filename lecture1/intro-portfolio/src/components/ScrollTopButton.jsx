import { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useScrollFrame from '../hooks/useScrollFrame';

// 오른쪽 아래 TOP 버튼 — 첫 화면을 넘어가면 나타나고, 누르면 맨 위로 부드럽게 스크롤된다
// (href="#home" — useSmoothScroll의 Lenis가 앵커 이동을 자연스럽게 이어준다)
// 왼쪽 아래 BackButton과 같은 자리·스타일(mixBlendMode)을 오른쪽에 짝지어 쓴다
const SHOW_AFTER = 0.8; // 이 비율(창 높이)만큼 스크롤하면 나타난다

const ScrollTopButton = () => {
  const ref = useRef(null);

  useScrollFrame(() => {
    const el = ref.current;
    if (!el) return;
    const visible = window.scrollY > window.innerHeight * SHOW_AFTER;
    el.style.opacity = visible ? '1' : '0';
    el.style.pointerEvents = visible ? 'auto' : 'none';
  });

  return (
    <Box
      component="a"
      href="#home"
      ref={ref}
      aria-label="맨 위로 이동"
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 30 },
        bottom: { xs: 16, md: 26 },
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1,
        pl: 1,
        color: '#ffffff',
        textDecoration: 'none',
        mixBlendMode: 'difference',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        '& .topArrow': { transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' },
        '&:hover .topArrow, &:focus-visible .topArrow': { transform: 'translateY(-6px)' },
        '&:hover .topLabel': { opacity: 0.7 },
      }}
    >
      <Typography
        className="topLabel"
        sx={{
          fontFamily: '"Alumni Sans", sans-serif',
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: '0.02em',
          lineHeight: 1,
          transition: 'opacity 0.2s',
        }}
      >
        TOP
      </Typography>
      <Box
        component="svg"
        className="topArrow"
        viewBox="0 0 34 24"
        aria-hidden
        sx={{ width: 30, height: 20, transform: 'rotate(90deg)' }}
      >
        <path d="M34 12 H2 M13 1 L2 12 L13 23" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </Box>
    </Box>
  );
};

export default ScrollTopButton;
