import Box from '@mui/material/Box'

const CircularText = ({ id, text, size = 200, fontSize = 13, spin = true }) => {
  const pathId = `circular-text-path-${id}`
  const radius = size / 2 - fontSize

  return (
    <Box
      sx={{
        width: size,
        height: size,
        animation: spin ? 'circular-text-spin 18s linear infinite' : 'none',
        '@keyframes circular-text-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <path
          id={pathId}
          fill="none"
          d={`M ${size / 2},${size / 2} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
        />
        <text fontFamily='"Alumni Sans"' fontWeight={600} fontSize={fontSize} letterSpacing="2">
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>
    </Box>
  )
}

export default CircularText
