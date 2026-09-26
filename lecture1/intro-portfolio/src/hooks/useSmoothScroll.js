import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// 관성이 느껴지는 부드러운 스크롤 (참고: dayonedream.com)
// 메뉴의 #앵커 링크도 부드럽게 이동하고, '동작 줄이기' 설정을 켠 사용자에겐 적용하지 않는다
const useSmoothScroll = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
};

export default useSmoothScroll;
