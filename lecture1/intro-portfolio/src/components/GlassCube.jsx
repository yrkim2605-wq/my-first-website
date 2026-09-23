import Box from '@mui/material/Box';

const HALF = 4; // cqw

const FACES = [
  { transform: `translateZ(${HALF}cqw)`, shade: 'rgba(90, 90, 90, 0.75)' },
  { transform: `rotateY(180deg) translateZ(${HALF}cqw)`, shade: 'rgba(60, 60, 60, 0.7)' },
  { transform: `rotateY(90deg) translateZ(${HALF}cqw)`, shade: 'rgba(160, 160, 160, 0.75)' },
  { transform: `rotateY(-90deg) translateZ(${HALF}cqw)`, shade: 'rgba(120, 120, 120, 0.7)' },
  { transform: `rotateX(90deg) translateZ(${HALF}cqw)`, shade: 'rgba(220, 220, 220, 0.8)' },
  { transform: `rotateX(-90deg) translateZ(${HALF}cqw)`, shade: 'rgba(40, 40, 40, 0.7)' },
];

const GlassCube = ({ sx = {} }) => {
  return (
    <Box
      aria-hidden
      sx={{
        width: `${HALF * 2}cqw`,
        height: `${HALF * 2}cqw`,
        perspective: '120cqw',
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
                background: `linear-gradient(135deg, rgba(255,255,255,0.35) 0%, ${face.shade} 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.45)',
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
