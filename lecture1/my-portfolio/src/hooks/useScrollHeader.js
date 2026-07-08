import { useEffect, useRef, useState } from 'react';
import { rafThrottle } from '../utils/rafThrottle';

const HIDE_THRESHOLD = 8;
const HIDE_AFTER_Y = 80;

export function useScrollHeader() {
  const [scrolledDown, setScrolledDown] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const sentinelRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const update = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) < HIDE_THRESHOLD) return;
      setScrolledDown(delta > 0 && currentY > HIDE_AFTER_Y);
      lastScrollY.current = currentY;
    };

    const handleScroll = rafThrottle(update);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { hidden: scrolledDown && !atTop, atTop, sentinelRef };
}
