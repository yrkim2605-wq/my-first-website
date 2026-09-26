import Box from '@mui/material/Box';

// 카드가 둘러선 원기둥 (참고: dayonedream.com 히어로)
// - 카메라를 가깝게 두어(perspective) 앞쪽 카드는 크게, 뒤쪽 카드는 작게 보이는 강한 원근감
// - 카드 바깥면엔 이미지, 안쪽면은 연회색 → 뒤쪽에선 원기둥 안쪽 벽이 보인다
// - 카드 하나를 여러 조각으로 나눠 휘어진 곡면처럼 보이게 한다

// image: 나중에 이미지 경로를 넣으면 회색 그라데이션 대신 이미지가 보인다
const PANELS = [
  { image: null, tone: ['#1d1d1f', '#5a5a5e'] },
  { image: null, tone: ['#2c2c2e', '#8a8a8e'] },
  { image: null, tone: ['#141414', '#4a4a4a'] },
  { image: null, tone: ['#3a3a3c', '#9c9ca0'] },
  { image: null, tone: ['#202022', '#6e6e72'] },
  { image: null, tone: ['#101010', '#565656'] },
  { image: null, tone: ['#303032', '#7c7c80'] },
  { image: null, tone: ['#1a1a1a', '#646464'] },
  { image: null, tone: ['#262628', '#8e8e92'] },
  { image: null, tone: ['#161618', '#5e5e62'] },
];

const SLICES_PER_PANEL = 8; // 카드 하나를 곡면처럼 보이게 나누는 조각 수
const GAP_DEG = 2.4; // 카드 사이 흰 틈 (각도)
const RADIUS = 21; // cqw
const BAND_HEIGHT = 17; // cqw
const PERSPECTIVE = 50; // cqw — 작을수록 카메라가 가까워 원근감이 강하다
const TILT = 'rotateZ(-26deg) rotateX(-26deg)'; // 위에서 비스듬히 내려다보는 각도
const SPIN_SECONDS = 60; // 한 바퀴 도는 시간

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

const RibbonBand = ({ sx = {} }) => {
  return (
    <Box aria-hidden sx={{ perspective: `${PERSPECTIVE}cqw`, ...sx }}>
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
            sx={{
              position: 'absolute',
              inset: 0,
              transformStyle: 'preserve-3d',
              animation: `bandSpin ${SPIN_SECONDS}s linear infinite`,
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
                <Box sx={{ ...faceSx, ...outerBackground(item) }} />
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
