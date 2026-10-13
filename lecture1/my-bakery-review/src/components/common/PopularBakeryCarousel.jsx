import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import BakeryStageCard from './BakeryStageCard'
import { GAME_ICON_BUTTON_SX } from '../../constants/rpgStyles'

const SLIDE_INTERVAL = 4000
const CARD_HEIGHT = { xs: 490, sm: 505, md: 525 } // 아래쪽 [빵집 탐험하기] 줄 높이만큼 늘렸어요
const VISIBLE_COUNT = 3

const NAV_BUTTON_SX = GAME_ICON_BUTTON_SX

// highlightedId: 지도에서 고른 빵집이 이 목록에 있으면 그 카드에 선택 표시를 해요
const PopularBakeryCarousel = ({ bakeries, highlightedId }) => {
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const total = bakeries.length

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

  const visibleItems = Array.from(
    { length: Math.min(VISIBLE_COUNT, total) },
    (_, i) => bakeries[(index + i) % total],
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
        <IconButton onClick={goToPrev} aria-label="이전 빵집" sx={NAV_BUTTON_SX}>
          <ChevronLeftIcon />
        </IconButton>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 2.5,
          }}
        >
          {visibleItems.map((bakery, i) => (
            <Box
              key={bakery.id}
              sx={{
                display: i === 2 ? { xs: 'none', md: 'block' } : i === 1 ? { xs: 'none', sm: 'block' } : 'block',
              }}
            >
              <BakeryStageCard {...bakery} variant="featured" height={CARD_HEIGHT} highlighted={bakery.id === highlightedId} quest />
            </Box>
          ))}
        </Box>

        <IconButton onClick={goToNext} aria-label="다음 빵집" sx={NAV_BUTTON_SX}>
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
          sx={{ ...NAV_BUTTON_SX, width: 36, height: 36 }}
        >
          {isPaused ? <PlayArrowIcon sx={{ fontSize: '1rem' }} /> : <PauseIcon sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default PopularBakeryCarousel
