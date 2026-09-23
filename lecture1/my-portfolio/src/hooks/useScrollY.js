import { useEffect, useRef } from 'react';
import { rafThrottle } from '../utils/rafThrottle';

// window.scrollY 값을 --scroll-y CSS 커스텀 프로퍼티로 기록 (리렌더 없이 DOM에 직접 반영)
export function useScrollY() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      el.style.setProperty('--scroll-y', String(window.scrollY));
    };

    const handleScroll = rafThrottle(update);
    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return ref;
}
