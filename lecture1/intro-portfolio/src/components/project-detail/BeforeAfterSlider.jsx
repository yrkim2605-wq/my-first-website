import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { POINT_LIME } from '../../constants/colors';

// 기존(before)과 리디자인(after) 전체 페이지를 겹쳐 두고, 손잡이를 좌우로 밀어 비교한다
// · 창 안은 세로로 스크롤된다 — 두 이미지가 한 스크롤 안에 있어 같은 높이를 함께 본다
// · 좌우로 끌면 경계가 움직이고(터치는 세로 스크롤과 겹치지 않게 가로 몸짓만 받는다), 키보드는 ← → 로 움직인다
// · isActive가 처음 true가 되면 손잡이가 한 번 좌우로 흔들려 "밀 수 있다"는 걸 알려 준다
// before·after: { src, alt }, sx: 바깥 창 크기·위치

const LABEL_SX = {
  position: 'absolute',
  top: 12,
  zIndex: 3,
  px: 1.25,
  py: 0.5,
  bgcolor: 'rgba(0, 0, 0, 0.72)',
  color: '#ffffff',
  fontFamily: '"Alumni Sans", sans-serif',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.12em',
  lineHeight: 1,
  pointerEvents: 'none',
};

const HINT_STEPS = [[0, 50], [500, 22], [1150, 72], [1750, 50]]; // [시각(ms), 위치(%)] — 흔들어 보이기

const clamp = (v) => Math.min(Math.max(v, 0), 100);

const BeforeAfterSlider = ({ before, after, isActive = true, sx = {} }) => {
  const frameRef = useRef(null);
  const dragRef = useRef(null); // 끄는 중인 포인터 정보
  const [position, setPosition] = useState(50); // 경계 위치 (%, 왼쪽이 before)
  const [isHinting, setIsHinting] = useState(false);
  const hasHintedRef = useRef(false);

  // 처음 보일 때 한 번 흔들어 보이기
  useEffect(() => {
    if (!isActive || hasHintedRef.current) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    hasHintedRef.current = true;
    const timers = HINT_STEPS.map(([at, pos], i) =>
      setTimeout(() => {
        setIsHinting(i < HINT_STEPS.length - 1);
        setPosition(pos);
      }, at + 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  const positionFromEvent = (event) => {
    const rect = frameRef.current.getBoundingClientRect();
    return clamp(((event.clientX - rect.left) / rect.width) * 100);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, isDragging: event.pointerType === 'mouse' };
    if (event.pointerType === 'mouse') {
      setIsHinting(false);
      setPosition(positionFromEvent(event));
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    // 터치: 처음 움직임이 가로 쪽이면 그때부터 끌기로 본다 (세로면 창 스크롤에 맡긴다)
    if (!drag.isDragging) {
      const dx = Math.abs(event.clientX - drag.x);
      const dy = Math.abs(event.clientY - drag.y);
      if (dx < 6 || dx < dy) return;
      drag.isDragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setIsHinting(false);
    setPosition(positionFromEvent(event));
  };

  const handlePointerEnd = (event) => {
    if (dragRef.current?.id === event.pointerId) dragRef.current = null;
  };

  return (
    <Box
      ref={frameRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        cursor: 'ew-resize',
        userSelect: 'none',
        touchAction: 'pan-y', // 세로 스크롤은 브라우저에, 가로 몸짓은 손잡이에
        boxShadow: '0 22px 50px rgba(0, 0, 0, 0.55)',
        ...sx,
      }}
    >
      {/* 두 이미지를 함께 담은 세로 스크롤 창
          data-lenis-prevent: 페이지의 부드러운 스크롤(useSmoothScroll)이 휠을 가로채지 않고 이 창이 직접 스크롤되게 한다 */}
      <Box
        data-lenis-prevent
        sx={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.35) transparent',
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Box component="img" src={after.src} alt={after.alt} draggable={false} sx={{ display: 'block', width: '100%' }} />
          {/* before 층 — after와 같은 높이로 깔고 경계까지만 보인다
              before 페이지가 더 짧아서, 끝난 뒤 남는 자리는 "여기서 끝" 판으로 채워 after가 비쳐 섞이지 않게 한다 */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#e9e9e9',
              clipPath: `inset(0 ${100 - position}% 0 0)`,
              transition: isHinting ? 'clip-path 0.6s cubic-bezier(0.65, 0, 0.35, 1)' : 'none',
            }}
          >
            <Box component="img" src={before.src} alt={before.alt} draggable={false} sx={{ display: 'block', width: '100%' }} />
            <Box
              aria-hidden
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-start',
                // 반만 보일 때도 읽히도록 왼쪽에 붙인다
                pt: 4,
                pl: 2.5,
                borderTop: '1px dashed rgba(0, 0, 0, 0.3)',
                backgroundImage: 'repeating-linear-gradient(-45deg, transparent 0 10px, rgba(0, 0, 0, 0.04) 10px 11px)',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Alumni Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: '0.16em',
                  color: 'rgba(0, 0, 0, 0.45)',
                  whiteSpace: 'nowrap',
                }}
              >
                END OF ORIGINAL PAGE
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Typography sx={{ ...LABEL_SX, left: 12 }}>BEFORE</Typography>
      <Typography sx={{ ...LABEL_SX, right: 12 }}>AFTER</Typography>

      {/* 경계선 + 손잡이 — 키보드로도 움직일 수 있는 슬라이더 */}
      <Box
        role="slider"
        tabIndex={0}
        aria-label="기존 디자인과 리디자인 비교 — 왼쪽은 기존, 오른쪽은 리디자인"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`기존 디자인 ${Math.round(position)}% 보임`}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 4;
          if (event.key === 'ArrowLeft') setPosition((p) => clamp(p - step));
          else if (event.key === 'ArrowRight') setPosition((p) => clamp(p + step));
          else if (event.key === 'Home') setPosition(0);
          else if (event.key === 'End') setPosition(100);
          else return;
          event.preventDefault();
          setIsHinting(false);
        }}
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          zIndex: 4,
          width: 0,
          transition: isHinting ? 'left 0.6s cubic-bezier(0.65, 0, 0.35, 1)' : 'none',
          outline: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -1,
            width: 2,
            bgcolor: '#ffffff',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.25)',
          },
          '&:focus-visible .knob': { outline: '2px solid #ffffff', outlineOffset: 3 },
        }}
      >
        <Box
          className="knob"
          aria-hidden
          sx={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: 44,
            height: 44,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            bgcolor: POINT_LIME,
            border: '1.5px solid #111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
            transition: 'scale 0.25s ease',
            '*:hover > &': { scale: '1.08' },
          }}
        >
          <Box component="svg" viewBox="0 0 24 24" sx={{ width: 22, height: 22 }}>
            <path d="M9 6 L3 12 L9 18 M15 6 L21 12 L15 18" fill="none" stroke="#111111" strokeWidth="1.8" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BeforeAfterSlider;
