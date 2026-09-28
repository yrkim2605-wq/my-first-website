import { useRef } from 'react';
import Box from '@mui/material/Box';
import useScrollFrame from '../../hooks/useScrollFrame';

// 섹션을 화면에 붙여 두고(sticky), 다음 섹션이 아래에서 덮으며 올라오는 동안
// 이 섹션은 서서히 어두워지고 살짝 작아지며 뒤로 물러난다 → 두 화면이 끊기지 않고 이어진다
// 다음 섹션은 position: relative + 더 높은 zIndex + 검은 배경이어야 이 섹션을 덮을 수 있다
const FADE_TO = 0.15; // 다 덮였을 때 남는 밝기
const SCALE_TO = 0.94; // 다 덮였을 때 크기
const BLUR_TO = 3; // 다 덮였을 때 흐림(px)

// id: 앵커 이동용. sticky 요소는 붙어 있는 동안 위치가 0이라, 원래 자리 표시(marker)에 붙여야 제대로 돌아온다
const SceneFade = ({ id, children }) => {
  const markerRef = useRef(null); // 섹션이 원래 있을 자리 (sticky라 스스로는 위치가 변하지 않는다)
  const sceneRef = useRef(null);

  useScrollFrame(() => {
    const marker = markerRef.current;
    const scene = sceneRef.current;
    if (!marker || !scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // 섹션 윗변이 화면 위에 닿은 뒤 창 높이만큼 스크롤하는 동안 0 → 1
    const progress = Math.min(Math.max(-marker.getBoundingClientRect().top / window.innerHeight, 0), 1);
    const eased = progress * progress * (3 - 2 * progress); // 처음과 끝을 부드럽게
    scene.style.opacity = 1 - (1 - FADE_TO) * eased;
    scene.style.transform = `scale(${1 - (1 - SCALE_TO) * eased})`;
    scene.style.filter = eased > 0.01 ? `blur(${eased * BLUR_TO}px)` : '';
  });

  return (
    <>
      <Box id={id} ref={markerRef} aria-hidden />
      <Box
        ref={sceneRef}
        sx={{ position: 'sticky', top: 0, zIndex: 0, transformOrigin: '50% 40%', willChange: 'opacity, transform' }}
      >
        {children}
      </Box>
    </>
  );
};

export default SceneFade;
