import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PopularReviewCard from './PopularReviewCard'
import { GAME_ICON_BUTTON_SX } from '../../constants/rpgStyles'

const SLIDE_INTERVAL = 3500
const REVIEW_EDGE_MASK = 'linear-gradient(to right, transparent 0, black 7%, black 93%, transparent 100%)'
const OFFSETS = [-2, -1, 0, 1, 2]

const NAV_BUTTON_SX = GAME_ICON_BUTTON_SX

const SLOT_SX_BY_OFFSET = {
  0: {
    // 모바일은 양옆 화살표를 뺀 남는 폭에 맞춰요 (고정 폭이면 좁은 화면에서 카드 양쪽이 잘려요)
    width: { xs: '100%', sm: 390, md: 440 },
    opacity: 1,
    zIndex: 2,
  },
  1: {
    width: { sm: 280, md: 310 },
    opacity: 0.85, // 바로 옆 카드: 사진과 글을 알아볼 수 있게
    zIndex: 1,
    display: { xs: 'none', sm: 'block' },
  },
  2: {
    width: { sm: 280, md: 310 },
    opacity: 0.7, // 바깥쪽 카드
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
            // 카드가 상자보다 넓어도 가운데 카드를 기준으로 양쪽이 똑같이 넘치도록 가운데 정렬
            justifyContent: 'center',
            gap: { xs: 0, sm: 1, md: 1.5 },
            overflow: 'hidden',
            // 넘친 양끝 카드가 뚝 잘리지 않고 부드럽게 흐려지게 (모바일은 카드 한 장이라 적용 안 함)
            maskImage: { sm: REVIEW_EDGE_MASK },
            WebkitMaskImage: { sm: REVIEW_EDGE_MASK },
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
                  avatarScale={review.avatarScale}
                  levelName={review.levelName}
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
          sx={{ ...NAV_BUTTON_SX, width: 36, height: 36 }}
        >
          {isPaused ? <PlayArrowIcon sx={{ fontSize: '1rem' }} /> : <PauseIcon sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Box>
    </Box>
  )
}

export default PopularReviewCarousel
