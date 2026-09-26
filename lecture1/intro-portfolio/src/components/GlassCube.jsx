import Box from '@mui/material/Box';

// 면마다 --s(한 변 길이)의 절반만큼 앞으로 밀어 정육면체를 만든다
const HALF = 'calc(var(--s) / 2)';

const FACES = [
  { transform: `translateZ(${HALF})`, shade: 'rgba(30, 30, 30, 0.85)' },
  { transform: `rotateY(180deg) translateZ(${HALF})`, shade: 'rgba(15, 15, 15, 0.8)' },
  { transform: `rotateY(90deg) translateZ(${HALF})`, shade: 'rgba(70, 70, 70, 0.85)' },
  { transform: `rotateY(-90deg) translateZ(${HALF})`, shade: 'rgba(45, 45, 45, 0.8)' },
  { transform: `rotateX(90deg) translateZ(${HALF})`, shade: 'rgba(110, 110, 110, 0.85)' },
  { transform: `rotateX(-90deg) translateZ(${HALF})`, shade: 'rgba(10, 10, 10, 0.8)' },
];
const FACE_HIGHLIGHT = 'rgba(255, 255, 255, 0.12)'; // 면 왼쪽 위의 은은한 빛

// size: 한 변 길이 (cqw, px, CSS 변수 등 어떤 길이든 가능)
const GlassCube = ({ size = '8cqw', sx = {} }) => {
  return (
    <Box
      aria-hidden
      sx={{
        '--s': size,
        width: 'var(--s)',
        height: 'var(--s)',
        // 카메라를 가깝게 두어 앞쪽 모서리는 크게, 뒤쪽 모서리는 작게 보이는 원근감
        perspective: 'calc(var(--s) * 2.5)',
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-35deg) rotateZ(-20deg)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            animation: 'cubeSpin 18s linear infinite',
          }}
        >
          {FACES.map((face) => (
            <Box
              key={face.transform}
              sx={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${FACE_HIGHLIGHT} 0%, ${face.shade} 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transform: face.transform,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default GlassCube;
