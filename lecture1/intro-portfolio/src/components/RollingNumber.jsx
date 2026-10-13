import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import useInView from '../hooks/useInView';

// 숫자가 자릿수마다 슬롯머신처럼 0 → 9를 한 바퀴 넘게 굴러 제 숫자에 멈춰 선다
// · 화면에 들어오면 한 번 굴러가고, 가장 가까운 [data-roll-trigger] 상자에 마우스를 올리거나 탭하면 다시 굴러간다
// · 숫자가 아닌 글자(~, -, 공백 등)는 그대로 보인다
// value: 보여줄 글자 (예: '01', '2020~2024'), delay: 첫 등장 지연(ms)

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; // 빠르게 돌다가 끝에서 천천히 멈춘다
const DURATION_MS = 1100;
const DIGIT_STAGGER_MS = 70; // 오른쪽 자리일수록 조금 늦게 멈춘다
const STRIP = [...'01234567890123456789']; // 두 바퀴 — 두 번째 바퀴의 숫자에 멈춰 한 바퀴 넘게 도는 느낌

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const RollingNumber = ({ value, delay = 0, sx = {} }) => {
  const [ref, isRolled] = useInView(0.6); // 한 번 화면에 들어오면 계속 true
  const [isReplaying, setIsReplaying] = useState(false); // 다시 굴리기 직전, 0으로 순간이동하는 한 프레임
  const frameRef = useRef(0);

  // 다시 굴리기 — 트리거 상자에 마우스를 올리거나 탭할 때
  useEffect(() => {
    const trigger = ref.current?.closest('[data-roll-trigger]');
    if (!trigger) return undefined;
    const replay = () => {
      if (prefersReducedMotion()) return;
      cancelAnimationFrame(frameRef.current);
      setIsReplaying(true);
      // 0 자리로 옮긴 화면이 한 번 그려진 뒤에 다시 굴린다
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => setIsReplaying(false));
      });
    };
    trigger.addEventListener('pointerenter', replay);
    trigger.addEventListener('click', replay);
    return () => {
      cancelAnimationFrame(frameRef.current);
      trigger.removeEventListener('pointerenter', replay);
      trigger.removeEventListener('click', replay);
    };
  }, [ref]);

  const showFinal = isRolled && !isReplaying;
  let digitIndex = -1;

  return (
    // lineHeight 1: 숫자 사이 글자(~, - 등)도 숫자 창과 같은 높이가 되어, 창이 늘어나 다음 숫자가 비치지 않는다
    <Box
      component="span"
      ref={ref}
      aria-label={value}
      sx={{ display: 'inline-flex', alignItems: 'flex-start', lineHeight: 1, whiteSpace: 'pre', ...sx }}
    >
      {[...value].map((char, i) => {
        if (!/\d/.test(char)) {
          return (
            <span key={i} aria-hidden>
              {char}
            </span>
          );
        }
        digitIndex += 1;
        const target = 10 + Number(char);
        const wait = (isReplaying ? 0 : delay) + digitIndex * DIGIT_STAGGER_MS;
        return (
          // 한 글자 크기만 보이는 창 — 안의 숫자 띠가 위로 올라가며 굴러간다
          // 창 크기는 보이지 않는 최종 숫자로 정해, 숫자마다 폭이 달라도 원래 글자 간격 그대로 보인다
          <Box
            key={i}
            component="span"
            aria-hidden
            sx={{ position: 'relative', display: 'inline-block', lineHeight: 1, overflow: 'hidden', verticalAlign: 'top' }}
          >
            <span style={{ visibility: 'hidden' }}>{char}</span>
            <Box
              component="span"
              sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translate(-50%, ${showFinal ? -target : 0}em)`,
                transition: isReplaying || !isRolled ? 'none' : `transform ${DURATION_MS}ms ${EASE} ${wait}ms`,
                '@media (prefers-reduced-motion: reduce)': { transform: `translate(-50%, ${-target}em)`, transition: 'none' },
              }}
            >
              {STRIP.map((digit, k) => (
                <span key={k} style={{ height: '1em', lineHeight: 1 }}>
                  {digit}
                </span>
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RollingNumber;
