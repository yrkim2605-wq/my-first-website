import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BakeryStageCard from './BakeryStageCard'
import { GAME_ICON_BUTTON_SX } from '../../constants/rpgStyles'

const CARD_HEIGHT = { xs: 490, sm: 505, md: 525 } // 아래쪽 [빵집 탐험하기] 줄 높이만큼 늘렸어요
const GAP = 20 // 카드 사이 간격(px)
const EDGE_TOLERANCE = 4 // 끝에 거의 닿았으면 끝으로 봐요

const NAV_BUTTON_SX = GAME_ICON_BUTTON_SX

// 추천 퀘스트: PC는 3장씩, 태블릿은 2장, 모바일은 1장(다음 카드가 살짝 보여요)을 보여줘요.
// 자동으로 넘어가지 않아요. 모바일은 손가락으로 밀고, PC · 태블릿은 화살표나 가로 스크롤로 넘겨요.
// highlightedId: 지도에서 고른 빵집이 이 목록에 있으면 그 카드에 선택 표시를 해요
const PopularBakeryCarousel = ({ bakeries, highlightedId }) => {
  const trackRef = useRef(null)
  const [edge, setEdge] = useState({ atStart: true, atEnd: false })
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const updateEdge = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setEdge({
      atStart: track.scrollLeft <= EDGE_TOLERANCE,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - EDGE_TOLERANCE,
    })
  }, [])

  // 화면 크기가 바뀌어 한 번에 보이는 카드 수가 달라져도 화살표 상태를 다시 맞춰요
  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateEdge)
    observer.observe(track)
    return () => observer.disconnect()
  }, [updateEdge])

  if (bakeries.length === 0) return null

  const scrollByCard = (direction) => {
    const track = trackRef.current
    const firstCard = track?.firstElementChild
    if (!firstCard) return
    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + GAP),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 1, md: 2 } }}>
      <IconButton
        onClick={() => scrollByCard(-1)}
        disabled={edge.atStart}
        aria-label="이전 빵집"
        sx={{ ...NAV_BUTTON_SX, display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Box
        ref={trackRef}
        onScroll={updateEdge}
        role="group"
        aria-label="추천 퀘스트 빵집 목록"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          gap: `${GAP}px`,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          // 카드가 위로 뜨는 효과와 그림자가 잘리지 않도록 위아래 여백을 주고, 바깥 여백은 음수로 되돌려요
          pt: 1.5,
          pb: 3,
          mt: -1.5,
          mb: -3,
        }}
      >
        {bakeries.map((bakery) => (
          <Box
            key={bakery.id}
            sx={{
              flex: {
                xs: '0 0 84%',
                sm: `0 0 calc((100% - ${GAP}px) / 2)`,
                md: `0 0 calc((100% - ${GAP * 2}px) / 3)`,
              },
              minWidth: 0,
              scrollSnapAlign: 'start',
            }}
          >
            <BakeryStageCard {...bakery} variant="featured" height={CARD_HEIGHT} highlighted={bakery.id === highlightedId} quest />
          </Box>
        ))}
      </Box>

      <IconButton
        onClick={() => scrollByCard(1)}
        disabled={edge.atEnd}
        aria-label="다음 빵집"
        sx={{ ...NAV_BUTTON_SX, display: { xs: 'none', sm: 'inline-flex' } }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  )
}

export default PopularBakeryCarousel
