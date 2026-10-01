import { useEffect, useRef, useState } from 'react';
import useInView from './useInView';

const easeOut = (t) => 1 - (1 - t) ** 3;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 화면에 들어오면 0에서 target까지 세며 올라간다 (숫자 카운팅 연출)
const useCountUp = (target, duration = 900) => {
  const [ref, isInView] = useInView(0.6);
  const [value, setValue] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!isInView || prefersReducedMotion()) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(easeOut(t) * target));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [isInView, target, duration]);

  // '동작 줄이기' 사용자에겐 세는 연출 없이 바로 최종 값을 보여 준다
  return [ref, isInView && prefersReducedMotion() ? target : value];
};

export default useCountUp;
