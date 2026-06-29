import { useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'

const SwipeCarousel = ({ items, renderItem, height, dotColor = '#39FF14', showDots = true }) => {
  const scrollRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.offsetWidth)
    setActiveIdx(idx)
  }, [])

  const scrollTo = (idx) => {
    scrollRef.current?.scrollTo({ left: idx * scrollRef.current.offsetWidth, behavior: 'smooth' })
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* 스와이프 컨테이너 */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          height,
        }}
      >
        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              flexShrink: 0,
              width: '100%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {renderItem(item, idx)}
          </Box>
        ))}
      </Box>

      {/* 도트 인디케이터 */}
      {showDots && items.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.6,
          }}
        >
          {items.map((_, i) => (
            <Box
              key={i}
              onClick={() => scrollTo(i)}
              sx={{
                width: i === activeIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                bgcolor: i === activeIdx ? dotColor : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}

      {/* 현재/전체 표시 (이미지가 많을 때) */}
      {showDots && items.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            borderRadius: 2,
            px: 1,
            py: 0.3,
          }}
        >
          <Box component="span" sx={{ color: 'white', fontSize: 12, fontWeight: 600 }}>
            {activeIdx + 1}/{items.length}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default SwipeCarousel
