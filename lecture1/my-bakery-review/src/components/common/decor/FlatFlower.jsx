import Box from '@mui/material/Box'

// 색 블록 모서리에 두는 납작한 꽃 장식이에요. 꽃잎 5장 + 가운데 원.
const PETAL_ANGLES = [0, 72, 144, 216, 288]

const FlatFlower = ({ petal = '#FBF6EA', center = '#E2B04A', size = 48, sx }) => {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 100 100"
      sx={{ width: size, height: size, display: 'block', pointerEvents: 'none', ...sx }}
    >
      {PETAL_ANGLES.map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="27"
          rx="17"
          ry="23"
          fill={petal}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="13" fill={center} />
    </Box>
  )
}

export default FlatFlower
