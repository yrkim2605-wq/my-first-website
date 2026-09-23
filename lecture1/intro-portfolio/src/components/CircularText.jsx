import Box from '@mui/material/Box';

const CircularText = ({
  text,
  size = 180,
  fontSize = 12,
  color = '#111111',
  duration = 20,
  sx = {},
}) => {
  const pathId = `circular-text-path-${text.length}-${size}`;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        animation: `spin ${duration}s linear infinite`,
        ...sx,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <path
            id={pathId}
            d={`M ${size / 2}, ${size / 2} m -${size / 2 - fontSize}, 0 a ${size / 2 - fontSize},${size / 2 - fontSize} 0 1,1 ${
              (size / 2 - fontSize) * 2
            },0 a ${size / 2 - fontSize},${size / 2 - fontSize} 0 1,1 -${(size / 2 - fontSize) * 2},0`}
            fill="none"
          />
        </defs>
        <text
          fill={color}
          fontFamily='"Alumni Sans", sans-serif'
          fontWeight={600}
          fontSize={fontSize}
          letterSpacing="1"
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
