import Box from '@mui/material/Box';

const SEGMENT_COUNT = 8; // 흰 틈으로 나뉘는 패널 수
const SLICES_PER_SEGMENT = 10; // 패널 하나를 곡면처럼 보이게 나누는 조각 수
const GAP_DEG = 2.2; // 패널 사이 흰 틈 (각도)
const RADIUS = 21; // cqw
const BAND_HEIGHT = 19; // cqw
const VIEW_ROTATE_Y = 18; // deg

const SEGMENT_DEG = 360 / SEGMENT_COUNT;
const SLICE_DEG = (SEGMENT_DEG - GAP_DEG) / SLICES_PER_SEGMENT;
// 조각 사이에 머리카락 같은 틈이 보이지 않도록 살짝 겹친다
const SLICE_WIDTH = 2 * RADIUS * Math.tan((SLICE_DEG * Math.PI) / 360) + 0.08;

const SLICES = Array.from({ length: SEGMENT_COUNT * SLICES_PER_SEGMENT }, (_, i) => {
  const segment = Math.floor(i / SLICES_PER_SEGMENT);
  const slice = i % SLICES_PER_SEGMENT;
  return segment * SEGMENT_DEG + (slice + 0.5) * SLICE_DEG;
});

// 조각이 향하는 방향에 따라 밝기를 부드럽게 바꾼다
// 바깥면(정면)은 왼쪽이 어둡고 오른쪽으로 갈수록 밝게, 안쪽면(뒤)은 밝은 회색
const sliceShade = (angleDeg) => {
  const rad = ((angleDeg + VIEW_ROTATE_Y) * Math.PI) / 180;
  const facing = Math.cos(rad);
  const side = Math.sin(rad);
  const lightness = facing > 0 ? 76 + side * 12 : 90 + side * 3;
  return `hsl(0 0% ${lightness.toFixed(1)}%)`;
};

const RibbonBand = ({ sx = {} }) => {
  return (
    <Box aria-hidden sx={{ perspective: '400cqw', ...sx }}>
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
            transform: `rotateZ(-24deg) rotateX(-24deg) rotateY(${VIEW_ROTATE_Y}deg)`,
          }}
        >
          {SLICES.map((angle) => (
            <Box
              key={angle}
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${SLICE_WIDTH}cqw`,
                height: `${BAND_HEIGHT}cqw`,
                ml: `${-SLICE_WIDTH / 2}cqw`,
                mt: `${-BAND_HEIGHT / 2}cqw`,
                background: `linear-gradient(90deg, ${sliceShade(angle - SLICE_DEG / 2)}, ${sliceShade(angle + SLICE_DEG / 2)})`,
                transform: `rotateY(${angle}deg) translateZ(${RADIUS}cqw)`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default RibbonBand;
