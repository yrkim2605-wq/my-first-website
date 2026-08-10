import Box from '@mui/material/Box'
import BakeryStageCard from './BakeryStageCard'

const CARD_WIDTH = 260
const EDGE_FADE = '10%'
const EDGE_MASK = `linear-gradient(to right, transparent 0, black ${EDGE_FADE}, black calc(100% - ${EDGE_FADE}), transparent 100%)`

const InfiniteBakeryMarquee = ({ bakeries }) => {
  if (bakeries.length === 0) return null

  const loopItems = [...bakeries, ...bakeries]
  const durationSeconds = bakeries.length * 3.2

  return (
    <Box
      sx={{
        overflow: 'hidden',
        width: '100%',
        maskImage: EDGE_MASK,
        WebkitMaskImage: EDGE_MASK,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: 'max-content',
          gap: 2.5,
          animation: `bakeryMarquee ${durationSeconds}s linear infinite`,
          '@keyframes bakeryMarquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        {loopItems.map((bakery, i) => (
          <Box key={`${bakery.id}-${i}`} sx={{ flex: `0 0 ${CARD_WIDTH}px`, width: CARD_WIDTH }}>
            <BakeryStageCard {...bakery} variant="default" />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default InfiniteBakeryMarquee
