import Box from '@mui/material/Box'
import { RADIUS } from '../../theme'

// 경험치 막대: 어두운 나무 홈 안에 금색 막대가 차오르는 모양이에요.
// percent(0~100)만 그려요. 값은 호출하는 쪽에서 방문 수 · 하트 수로 계산한 진행률을 그대로 넘겨요.
// size="sm"은 헤더 배지처럼 좁은 곳용이에요. aria 속성 등은 ...rest로 바깥 상자에 붙어요.
const SIZES = {
  md: { height: 20, pad: '2px', border: '2px', shine: true },
  sm: { height: 12, pad: '1.5px', border: '1.5px', shine: false },
}

const XpTrack = ({ percent, size = 'md', sx, ...rest }) => {
  const { height, pad, border, shine } = SIZES[size]

  return (
    <Box
      {...rest}
      sx={{
        height,
        p: pad,
        borderRadius: RADIUS.pill,
        bgcolor: 'wood.dark',
        border: `${border} solid #2a1a0c`,
        boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.45)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: `${percent}%`,
          minWidth: percent > 0 ? height * 0.5 : 0,
          height: '100%',
          borderRadius: RADIUS.pill,
          background: (theme) =>
            `linear-gradient(180deg, ${theme.palette.gold.light}, ${theme.palette.gold.main} 55%, ${theme.palette.gold.dark})`,
          // 막대 윗면의 반짝임
          '&::after': shine && {
            content: '""',
            position: 'absolute',
            top: 2,
            left: 5,
            right: 5,
            height: 3,
            borderRadius: RADIUS.pill,
            bgcolor: 'rgba(255,255,255,0.55)',
          },
        }}
      />
    </Box>
  )
}

export default XpTrack
