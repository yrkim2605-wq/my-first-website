import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import BakeryStageCard from './BakeryStageCard'

const SLIDE_INTERVAL = 4000
const CARD_HEIGHT = { xs: 460, sm: 480, md: 500 }
const VISIBLE_COUNT = 3

// 좌측 화살표 버튼(약 40px) + gap 만큼, 실제 카드가 시작되는 지점의 들여쓰기.
// 제목 등 카드 행 바깥의 요소를 카드와 맞추려면 이 값만큼 왼쪽 여백을 추가로 준다.
export const CAROUSEL_CARD_INSET = { xs: '48px', md: '56px' }

const NAV_BUTTON_SX = {
  bgcolor: 'background.paper',
  boxShadow: '0 2px 8px rgba(46,42,37,0.15)',
  flexShrink: 0,
  '&:hover': { bgcolor: '#fff' },
}

const PopularBakeryCarousel = ({ bakeries }) => {
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
              <BakeryStageCard {...bakery} variant="featured" height={CARD_HEIGHT} />
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
          sx={{ ...NAV_BUTTON_SX, width: 28, height: 28 }}
        >
          {isPaused ? <PlayArrowIcon sx={{ fontSize: '1rem' }} /> : <PauseIcon sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default PopularBakeryCarousel
