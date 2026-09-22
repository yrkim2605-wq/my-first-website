import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const RadialSkillDiagram = ({ items, centerLabel, size = 480, radius = 190 }) => {
  const center = size / 2
  const points = items.map((item, index) => {
    const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2
    return {
      label: item,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  })

  return (
    <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
      <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
        {points.map((point) => (
          <line
            key={point.label}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="rgba(0, 0, 0, 0.35)"
            strokeWidth={1}
          />
        ))}
      </svg>

      <Box
        sx={{
          position: 'absolute',
          top: center,
          left: center,
          transform: 'translate(-50%, -50%)',
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          bgcolor: 'primary.main',
          color: 'background.default',
          fontFamily: 'Anton',
          fontSize: '1.25rem',
        }}
      >
        {centerLabel}
      </Box>

      {points.map((point) => (
        <Typography
          key={point.label}
          sx={{
            position: 'absolute',
            top: point.y,
            left: point.x,
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            bgcolor: 'background.default',
            px: 1.5,
            py: 0.5,
            fontFamily: '"Alumni Sans"',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {point.label}
        </Typography>
      ))}
    </Box>
  )
}

export default RadialSkillDiagram
