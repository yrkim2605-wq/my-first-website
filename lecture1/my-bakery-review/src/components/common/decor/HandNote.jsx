import Box from '@mui/material/Box'

// 여백에 살짝 기울여 적는 손글씨 메모예요. 장식 전용으로 개구(Gaegu) 폰트를 써요. 꾸밈용이라 클릭을 막지 않고, 화면 읽기 프로그램은 건너뛰어요.
// 줄을 나누고 싶으면 children 안에 <br />를 넣어요.
const HandNote = ({ children, color = 'primary.main', rotate = -6, sx }) => (
  <Box
    aria-hidden="true"
    sx={{
      fontFamily: '"Gaegu", cursive',
      fontWeight: 700,
      fontSize: '1.45rem',
      lineHeight: 1.3,
      color,
      transform: `rotate(${rotate}deg)`,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none',
      ...sx,
    }}
  >
    {children}
  </Box>
)

export default HandNote
