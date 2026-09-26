import { useEffect, useRef } from 'react';

// 스크롤·창 크기 변경 때마다 한 프레임에 한 번 callback을 실행한다
// callback 안에서 ref로 DOM 스타일을 직접 바꾸면, 매 프레임 리렌더링 없이 가볍게 움직일 수 있다
const useScrollFrame = (callback) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      callbackRef.current();
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    run();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
    };
  }, []);
};

export default useScrollFrame;
