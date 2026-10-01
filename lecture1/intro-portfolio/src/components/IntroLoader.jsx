import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { markIntroSeen, showIntro } from '../constants/decor';

// 메인 페이지 로딩 인트로 (참고: seunghyuk.com)
// 흰 화면 가운데에 검은 세로선이 그어졌다가 작은 네모로 접히고, 화면이 걷히며 히어로가 등장한다
// 탭마다 처음 한 번만 보여 주고, '동작 줄이기' 사용자에겐 보여 주지 않는다 (decor.js의 showIntro)
// 움직임은 index.css의 introLine·introOut 키프레임

const IntroLoader = () => {
  const [isDone, setIsDone] = useState(!showIntro);

  useEffect(() => {
    if (showIntro) markIntroSeen();
  }, []);

  if (isDone) return null;

  return (
    <Box
      className="introLoader"
      aria-hidden
      onAnimationEnd={(event) => {
        if (event.animationName === 'introOut') setIsDone(true);
      }}
    >
      <span className="introMark" />
    </Box>
  );
};

export default IntroLoader;
