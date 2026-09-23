import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

const TRAIL_COUNT = 5;
const DOT_EASE = 0.35;
const RING_EASE = 0.15;
const TRAIL_EASE = 0.28;

const RING_SIZE = { default: 32, link: 56, text: 4 };

function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState('default');

  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const trailRefs = useRef([]);

  const mouse = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const trailPos = useRef(Array.from({ length: TRAIL_COUNT }, () => ({ x: -100, y: -100 })));

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    setEnabled(!isCoarse);
    if (!isCoarse) {
      document.body.classList.add('custom-cursor-active');
    }
    return () => document.body.classList.remove('custom-cursor-active');
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleOver = (e) => {
      const target = e.target.closest('a, button, [role="button"], .magnetic');
      const textTarget = e.target.closest('input, textarea, [contenteditable="true"]');
      setVariant(target ? 'link' : textTarget ? 'text' : 'default');
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseover', handleOver, { passive: true });

    let frame;
    const tick = () => {
      dotPos.current.x += (mouse.current.x - dotPos.current.x) * DOT_EASE;
      dotPos.current.y += (mouse.current.y - dotPos.current.y) * DOT_EASE;
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * RING_EASE;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * RING_EASE;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      let prevX = mouse.current.x;
      let prevY = mouse.current.y;
      trailPos.current.forEach((pos, index) => {
        pos.x += (prevX - pos.x) * TRAIL_EASE;
        pos.y += (prevY - pos.y) * TRAIL_EASE;
        const el = trailRefs.current[index];
        if (el) {
          el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
          el.style.opacity = String(0.5 - index / (TRAIL_COUNT * 2));
        }
        prevX = pos.x;
        prevY = pos.y;
      });

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2000 }}>
      {Array.from({ length: TRAIL_COUNT }).map((_, index) => (
        <Box
          key={index}
          ref={(el) => {
            trailRefs.current[index] = el;
          }}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            willChange: 'transform',
          }}
        />
      ))}
      <Box
        ref={ringRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: RING_SIZE[variant],
          height: variant === 'text' ? 40 : RING_SIZE[variant],
          borderRadius: variant === 'text' ? '2px' : '50%',
          border: '1.5px solid',
          borderColor: 'primary.light',
          bgcolor: variant === 'link' ? 'rgba(124, 107, 255, 0.15)' : 'transparent',
          transition: 'width 0.25s ease, height 0.25s ease, background-color 0.25s ease, border-radius 0.25s ease',
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />
      <Box
        ref={dotRef}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: '#FFFFFF',
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />
    </Box>
  );
}

export default CustomCursor;
