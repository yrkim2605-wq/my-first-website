import Box from '@mui/material/Box'

// 네 갈래 반짝이 별이에요 (금색). 꾸밈용이라 클릭을 막지 않아요.
// twinkle을 켜면 천천히 깜빡여요 (움직임 줄이기 설정을 켠 사람에게는 멈춰요).
const Sparkle = ({ size = 20, color = '#E2B04A', twinkle = false, delay = 0, sx }) => (
  <Box
    component="svg"
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={twinkle ? 'twinkle' : undefined}
    sx={{ width: size, height: size, display: 'block', pointerEvents: 'none', animationDelay: `${delay}s`, ...sx }}
  >
    <path d="M12 0 C12.8 7 17 11.2 24 12 C17 12.8 12.8 17 12 24 C11.2 17 7 12.8 0 12 C7 11.2 11.2 7 12 0 Z" fill={color} />
  </Box>
)

export default Sparkle
