import Box from '@mui/material/Box';

const CircularText = ({
  text,
  size = 180,
  fontSize = 12,
  color = '#111111',
  duration = 20,
  reverse = false,
  sx = {},
}) => {
  const pathId = `circular-text-path-${text.length}-${size}-${reverse ? 'r' : 'f'}`;
  const r = size / 2 - fontSize;
  // reverse: 왼쪽 → 아래 → 오른쪽 → 위 순서(반시계)로 글자가 흐르고, 글자 윗부분이 원 중심을 향한다
  const sweep = reverse ? 0 : 1;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        animation: `spin ${duration}s linear infinite`,
        ...sx,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
        <defs>
          <path
            id={pathId}
            d={`M ${size / 2}, ${size / 2} m -${r}, 0 a ${r},${r} 0 1,${sweep} ${r * 2},0 a ${r},${r} 0 1,${sweep} -${r * 2},0`}
            fill="none"
          />
        </defs>
        <text
          fill={color}
          fontFamily='"Alumni Sans", sans-serif'
          fontWeight={600}
          fontSize={fontSize}
          letterSpacing={fontSize * -0.02}
        >
          <textPath href={`#${pathId}`} startOffset="0%">
            {text}
          </textPath>
        </text>
      </svg>
    </Box>
  );
};

export default CircularText;
