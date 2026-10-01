import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { navigateWithFade } from '../utils/pageTransition';
import drJartThumb from '../assets/project-drjart-mobile.png';
import aiInfluencerThumb from '../assets/project-ai-influencer-left.jpg';
import illustrationThumb from '../assets/project-illustration.png';
import appleslateKeyringThumb from '../assets/project-appleslate-keyring.jpg';

// 카드가 둘러선 원기둥 (참고: dayonedream.com 히어로)
// - 카메라를 가깝게 두어(perspective) 앞쪽 카드는 크게, 뒤쪽 카드는 작게 보이는 강한 원근감
// - 카드 바깥면엔 이미지, 안쪽면은 연회색 → 뒤쪽에선 원기둥 안쪽 벽이 보인다
// - 카드 하나를 여러 조각으로 나눠 휘어진 곡면처럼 보이게 한다
// - 카드를 누르면 그 프로젝트로 이동한다 (끌어서 돌린 경우는 제외)

// 프로젝트 4장을 순서대로 반복해 열 장을 채운다 (애플슬레이트 키링은 일러스트 바로 오른쪽에 오도록)
// link: 아래 Projects 섹션과 같은 주소 — 외부 사이트는 새 탭, 포트폴리오 안의 페이지는 화면이 어두워지며 넘어간다
//   애플슬레이트 키링은 일러스트 상세 페이지의 굿즈 작업이라 그 페이지로 보낸다
const PROJECT_CARDS = [
  { image: drJartThumb, link: 'https://yrkim2605-wq.github.io/dr-jart-website/' },
  { image: aiInfluencerThumb, link: `${import.meta.env.BASE_URL}project-ai.html` },
  { image: illustrationThumb, link: `${import.meta.env.BASE_URL}project-illustration.html` },
  { image: appleslateKeyringThumb, link: `${import.meta.env.BASE_URL}project-illustration.html` },
];

// image: null이면 회색 그라데이션(tone), 있으면 프로젝트 이미지가 보인다
const PANELS = [
  { ...PROJECT_CARDS[0], tone: ['#1d1d1f', '#5a5a5e'] },
  { ...PROJECT_CARDS[1], tone: ['#2c2c2e', '#8a8a8e'] },
  { ...PROJECT_CARDS[2], tone: ['#141414', '#4a4a4a'] },
  { ...PROJECT_CARDS[3], tone: ['#3a3a3c', '#9c9ca0'] },
  { ...PROJECT_CARDS[0], tone: ['#202022', '#6e6e72'] },
  { ...PROJECT_CARDS[1], tone: ['#101010', '#565656'] },
  { ...PROJECT_CARDS[2], tone: ['#303032', '#7c7c80'] },
  { ...PROJECT_CARDS[3], tone: ['#1a1a1a', '#646464'] },
  { ...PROJECT_CARDS[0], tone: ['#262628', '#8e8e92'] },
  { ...PROJECT_CARDS[1], tone: ['#161618', '#5e5e62'] },
];

const SLICES_PER_PANEL = 8; // 카드 하나를 곡면처럼 보이게 나누는 조각 수
const GAP_DEG = 2.4; // 카드 사이 흰 틈 (각도)
const RADIUS = 21; // cqw
const BAND_HEIGHT = 17; // cqw
const PERSPECTIVE = 50; // cqw — 작을수록 카메라가 가까워 원근감이 강하다
const TILT = 'rotateZ(-26deg) rotateX(-26deg)'; // 위에서 비스듬히 내려다보는 각도
const SPIN_SECONDS = 60; // 가만히 두면 한 바퀴 도는 시간
const DRAG_SENSITIVITY = 0.35; // 드래그 1px당 도는 각도(deg)
const CLICK_SLOP = 6; // px — 이보다 적게 움직이고 떼면 끌기가 아니라 카드 클릭으로 본다

const openLink = (link) => {
  if (/^https?:\/\//.test(link)) {
    window.open(link, '_blank', 'noreferrer');
    return;
  }
  navigateWithFade(() => {
    window.location.href = link;
  });
};

const PANEL_DEG = 360 / PANELS.length;
const SLICE_DEG = (PANEL_DEG - GAP_DEG) / SLICES_PER_PANEL;
// 조각 사이에 머리카락 같은 틈이 보이지 않도록 살짝 겹친다
const SLICE_WIDTH = 2 * RADIUS * Math.tan((SLICE_DEG * Math.PI) / 360) + 0.06;

const SLICES = PANELS.flatMap((panel, p) =>
  Array.from({ length: SLICES_PER_PANEL }, (_, s) => ({
    key: `${p}-${s}`,
    panel,
    slice: s,
    angle: p * PANEL_DEG + (s + 0.5) * SLICE_DEG,
  })),
);

// 카드 이미지를 조각 수만큼 늘려 깔고, 조각마다 자기 몫의 위치만 보여 준다
const outerBackground = ({ panel, slice }) => ({
  backgroundImage: panel.image
    ? `url(${panel.image})`
    : `linear-gradient(160deg, ${panel.tone[0]} 0%, ${panel.tone[1]} 100%)`,
  backgroundSize: `${SLICES_PER_PANEL * 100}% 100%`,
  backgroundPosition: `${(slice / (SLICES_PER_PANEL - 1)) * 100}% 0`,
});

const faceSx = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
};

// 드래그로 직접 돌릴 수 있는 원기둥 — 손을 떼면 다시 저절로 돈다
// angleRef: 지금 회전각(도) — 리렌더 없이 매 프레임 spinRef의 DOM에 직접 써서 가볍게 움직인다
const useDragSpin = () => {
  const spinRef = useRef(null);
  const angleRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startAngleRef = useRef(0);
  const pressedLinkRef = useRef(null); // 누르기 시작한 카드의 주소 (카드 밖이면 null)

  useEffect(() => {
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!draggingRef.current) {
        angleRef.current += (360 / SPIN_SECONDS) * dt;
      }
      if (spinRef.current) {
        spinRef.current.style.transform = `rotateY(${angleRef.current}deg)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const onPointerDown = (event) => {
    draggingRef.current = true;
    startXRef.current = event.clientX;
    startAngleRef.current = angleRef.current;
    // 포인터를 붙잡으면 손을 뗄 때의 대상이 바깥 상자로 바뀌므로, 누른 카드는 지금 기억해 둔다
    pressedLinkRef.current = event.target.closest('[data-link]')?.dataset.link ?? null;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - startXRef.current;
    if (Math.abs(dx) > CLICK_SLOP) pressedLinkRef.current = null; // 끌기 시작하면 클릭이 아니다
    angleRef.current = startAngleRef.current + dx * DRAG_SENSITIVITY;
  };
  const endDrag = () => {
    draggingRef.current = false;
    pressedLinkRef.current = null;
  };
  const onPointerUp = () => {
    const link = pressedLinkRef.current;
    endDrag();
    if (link) openLink(link);
  };

  return { spinRef, dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: endDrag } };
};

const RibbonBand = ({ sx = {} }) => {
  const { spinRef, dragHandlers } = useDragSpin();

  return (
    <Box
      aria-hidden
      {...dragHandlers}
      sx={{
        perspective: `${PERSPECTIVE}cqw`,
        cursor: 'grab',
        touchAction: 'pan-y',
        userSelect: 'none',
        '&:active, &:active *': { cursor: 'grabbing' },
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          animation: 'float 6s ease-in-out infinite',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: TILT,
          }}
        >
          <Box
            ref={spinRef}
            sx={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
            }}
          >
            {SLICES.map((item) => (
              <Box
                key={item.key}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${SLICE_WIDTH}cqw`,
                  height: `${BAND_HEIGHT}cqw`,
                  ml: `${-SLICE_WIDTH / 2}cqw`,
                  mt: `${-BAND_HEIGHT / 2}cqw`,
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${item.angle}deg) translateZ(${RADIUS}cqw)`,
                }}
              >
                {/* 바깥면: 카드 이미지 */}
                <Box
                  data-link={item.panel.link}
                  sx={{ ...faceSx, ...outerBackground(item), cursor: 'pointer' }}
                />
                {/* 안쪽면: 연회색 벽 */}
                <Box
                  sx={{
                    ...faceSx,
                    bgcolor: '#ebebeb',
                    transform: 'rotateY(180deg)',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RibbonBand;
