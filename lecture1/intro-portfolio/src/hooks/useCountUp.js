import { useEffect, useRef, useState } from 'react';
import useInView from './useInView';

const easeOut = (t) => 1 - (1 - t) ** 3;

// 화면에 들어오면 0에서 target까지 세며 올라간다 (숫자 카운팅 연출)
const useCountUp = (target, duration = 900) => {
  const [ref, isInView] = useInView(0.6);
  const [value, setValue] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!isInView) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(easeOut(t) * target));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [isInView, target, duration]);

  return [ref, value];
};

export default useCountUp;
