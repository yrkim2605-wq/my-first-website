import Box from '@mui/material/Box'

// 색 블록 섹션의 위/아래에 붙이는 물결(스캘럽) 가장자리예요.
// color: 블록과 같은 색(테마 이름 아님, 실제 색 값), position: 블록의 'top' 또는 'bottom'
// size: 물결 하나의 폭, depth: 물결 높이 (폭보다 많이 낮게 해서 납작하고 큼직한 물결로 보여요)
const ScallopEdge = ({ color, position = 'bottom', size = 80, depth = 22 }) => {
  // 납작한 반타원을 가로로 반복해요. 아래쪽이면 블록 밖(아래)으로 늘어지고, 위쪽이면 위로 솟아요.
  const ellipseY = position === 'bottom' ? '0' : '100%'

  return (
    <Box
      aria-hidden="true"
      sx={{
        height: depth,
        width: '100%',
        backgroundImage: `radial-gradient(${size / 2}px ${depth}px at 50% ${ellipseY}, ${color} 98%, transparent 100%)`,
        backgroundSize: `${size}px ${depth}px`,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
      }}
    />
  )
}

export default ScallopEdge
