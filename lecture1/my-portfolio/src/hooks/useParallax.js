import { useEffect, useRef } from 'react';
import { rafThrottle } from '../utils/rafThrottle';

// 요소가 뷰포트 중앙에서 얼마나 떨어져 있는지에 비례해 --parallax-y 커스텀 프로퍼티를 기록
export function useParallax(speed = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const distance = elementCenter - viewportCenter;
      el.style.setProperty('--parallax-y', `${(distance * speed * -1).toFixed(2)}px`);
    };

    const handleScroll = rafThrottle(update);
    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [speed]);

  return ref;
}
