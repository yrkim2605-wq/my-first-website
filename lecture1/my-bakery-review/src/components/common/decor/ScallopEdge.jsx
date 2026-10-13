import Box from '@mui/material/Box'

// 색 블록 섹션의 위/아래에 붙이는 물결(스캘럽) 가장자리예요.
// color: 블록과 같은 색(테마 이름 아님, 실제 색 값), position: 블록의 'top' 또는 'bottom'
const ScallopEdge = ({ color, position = 'bottom', size = 28 }) => {
  const radius = size / 2
  // 반원을 가로로 반복해서 그려요. 아래쪽이면 반원이 블록 밖(아래)으로 늘어지고, 위쪽이면 위로 솟아요.
  const circleY = position === 'bottom' ? '0' : '100%'

  return (
    <Box
      aria-hidden="true"
      sx={{
        height: radius,
        width: '100%',
        backgroundImage: `radial-gradient(circle at 50% ${circleY}, ${color} ${radius - 0.5}px, transparent ${radius}px)`,
        backgroundSize: `${size}px ${radius}px`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
      }}
    />
  )
}

export default ScallopEdge
