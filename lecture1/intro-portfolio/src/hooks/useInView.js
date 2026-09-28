import { useEffect, useRef, useState } from 'react';

// 요소가 화면에 threshold 비율만큼 들어오면 true가 된다 (한 번 보이면 계속 true)
const useInView = (threshold = 0.35) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView];
};

export default useInView;
