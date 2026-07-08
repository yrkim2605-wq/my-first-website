import { useEffect, useRef } from 'react';

export function useMagneticHover(strength = 0.35) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      el.style.transition = 'transform 0.15s ease-out';
      el.style.transform = `translate3d(${relX * strength}px, ${relY * strength}px, 0)`;
    };

    const handleLeave = () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [strength]);

  return ref;
}
