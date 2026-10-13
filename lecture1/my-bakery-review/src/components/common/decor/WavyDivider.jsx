import Box from '@mui/material/Box'

// 섹션 제목 아래에 들어가는 작은 물결 선(〰)이에요.
const WavyDivider = ({ color = 'mustard.main', width = 56, sx }) => {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 56 10"
      sx={{ width, height: (width / 56) * 10, color, display: 'block', ...sx }}
    >
      <path
        d="M2 5 Q 8 0, 14 5 T 26 5 T 38 5 T 50 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Box>
  )
}

export default WavyDivider
