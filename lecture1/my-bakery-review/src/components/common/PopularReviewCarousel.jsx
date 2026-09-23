import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PopularReviewCard from './PopularReviewCard'

const SLIDE_INTERVAL = 3500
const OFFSETS = [-2, -1, 0, 1, 2]

const NAV_BUTTON_SX = {
  bgcolor: 'background.paper',
  boxShadow: '0 2px 8px rgba(46,42,37,0.15)',
  flexShrink: 0,
  '&:hover': { bgcolor: '#fff' },
}

const SLOT_SX_BY_OFFSET = {
  0: {
    width: { xs: 330, sm: 390, md: 440 },
    opacity: 1,
    zIndex: 2,
  },
  1: {
    width: { sm: 280, md: 310 },
    opacity: 0.55,
    zIndex: 1,
    display: { xs: 'none', sm: 'block' },
  },
  2: {
    width: { sm: 280, md: 310 },
    opacity: 0.55,
    zIndex: 1,
    display: { xs: 'none', md: 'block' },
  },
}

const sizeForOffset = (offset) => (offset === 0 ? 'lg' : 'default')

const PopularReviewCarousel = ({ reviews }) => {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = reviews.length

  useEffect(() => {
    if (isPaused || total <= 1) return undefined
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % total)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [isPaused, total])

  if (total === 0) return null

  const goToPrev = () => setIndex((prev) => (prev - 1 + total) % total)
  const goToNext = () => setIndex((prev) => (prev + 1) % total)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
        <IconButton onClick={goToPrev} aria-label="이전 리뷰" sx={NAV_BUTTON_SX}>
          <ChevronLeftIcon />
        </IconButton>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'space-between' },
            gap: { xs: 0, sm: 1, md: 1.5 },
            overflow: 'hidden',
          }}
        >
          {OFFSETS.map((offset) => {
            const review = reviews[(index + offset + total) % total]
            return (
              <Box
                key={`${offset}-${review.id}`}
                sx={{
                  ...SLOT_SX_BY_OFFSET[Math.abs(offset)],
                  flexShrink: 0,
                  transition: 'width 0.4s ease, opacity 0.4s ease',
                }}
              >
                <PopularReviewCard
                  bakeryId={review.bakeryId}
                  bakeryName={review.bakery?.name}
                  bakeryEmoji={review.bakery?.emoji}
                  bakeryIconImage={review.bakery?.iconImage}
                  avatarEmoji={review.avatarEmoji}
                  avatarImage={review.avatarImage}
                  author={review.author}
                  rating={review.rating}
                  content={review.content}
                  size={sizeForOffset(offset)}
                />
              </Box>
            )
          })}
        </Box>

        <IconButton onClick={goToNext} aria-label="다음 리뷰" sx={NAV_BUTTON_SX}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mt: 3 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'text.secondary' }}>
          {index + 1}
          <Box component="span" sx={{ opacity: 0.4, mx: 0.75 }}>
            |
          </Box>
          {total}
        </Typography>
        <IconButton
          onClick={() => setIsPaused((prev) => !prev)}
          aria-label={isPaused ? '자동 재생' : '일시 정지'}
          size="small"
          sx={{ ...NAV_BUTTON_SX, width: 28, height: 28 }}
        >
          {isPaused ? <PlayArrowIcon sx={{ fontSize: '1rem' }} /> : <PauseIcon sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default PopularReviewCarousel
