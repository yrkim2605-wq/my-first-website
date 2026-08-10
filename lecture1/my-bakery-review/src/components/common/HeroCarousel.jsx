import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const SLIDE_INTERVAL = 3500
const PARALLAX_FACTOR = 0.4

const STAGE_HEIGHT = { xs: '62vh', sm: '75vh', md: '88vh' }
const STAGE_MIN_HEIGHT = { xs: 420, sm: 520, md: 600 }
const STAGE_MAX_HEIGHT = 860
const CONTENT_ZONE_HEIGHT = { xs: '78vh', sm: '74vh', md: '70vh' }
const CONTENT_ZONE_MIN_HEIGHT = { xs: 500, sm: 520, md: 560 }
const CONTENT_ZONE_MAX_HEIGHT = 760
// fraction of viewport height, measured from the content zone's top edge.
// The zone's top sits well above the actual phrase (subtitle + spacing +
// ScrollFillText's own reveal, which finishes filling in around 0.42vh of
// its own position), so the shrink threshold is kept low enough that the
// phrase has already finished appearing before it starts shrinking away.
const CONTENT_SHRINK_START_VH = 0.18
const CONTENT_SHRINK_END_VH = -0.22

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const pad = (n) => String(n + 1).padStart(2, '0')

// images continue underneath `children`, so scrolling past the hero reveals
// the same photo (darkened) as the backdrop for that content instead of a
// second, duplicate image.
const HeroCarousel = ({ images, children }) => {
  const [index, setIndex] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [contentOpacity, setContentOpacity] = useState(1)
  const contentZoneRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [images.length])

  useEffect(() => {
    let ticking = false
    const update = () => {
      setScrollY(window.scrollY)
      if (contentZoneRef.current) {
        const rect = contentZoneRef.current.getBoundingClientRect()
        const viewportH = window.innerHeight
        const start = viewportH * CONTENT_SHRINK_START_VH
        const end = viewportH * CONTENT_SHRINK_END_VH
        setContentOpacity(clamp((rect.top - end) / (start - end), 0, 1))
      }
    }
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        update()
        ticking = false
      })
    }
    update()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goToPrev = () => setIndex((prev) => (prev - 1 + images.length) % images.length)
  const goToNext = () => setIndex((prev) => (prev + 1) % images.length)

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        height: children
          ? {
              xs: `calc(${STAGE_HEIGHT.xs} + ${CONTENT_ZONE_HEIGHT.xs})`,
              sm: `calc(${STAGE_HEIGHT.sm} + ${CONTENT_ZONE_HEIGHT.sm})`,
              md: `calc(${STAGE_HEIGHT.md} + ${CONTENT_ZONE_HEIGHT.md})`,
            }
          : STAGE_HEIGHT,
        minHeight: children
          ? {
              xs: STAGE_MIN_HEIGHT.xs + CONTENT_ZONE_MIN_HEIGHT.xs,
              sm: STAGE_MIN_HEIGHT.sm + CONTENT_ZONE_MIN_HEIGHT.sm,
              md: STAGE_MIN_HEIGHT.md + CONTENT_ZONE_MIN_HEIGHT.md,
            }
          : STAGE_MIN_HEIGHT,
        maxHeight: children ? STAGE_MAX_HEIGHT + CONTENT_ZONE_MAX_HEIGHT : STAGE_MAX_HEIGHT,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: children ? contentOpacity : 1,
          transform: `translateY(${scrollY * PARALLAX_FACTOR}px) scale(${children ? 0.94 + contentOpacity * 0.06 : 1})`,
          transformOrigin: 'center center',
          transition: 'opacity 0.15s linear, transform 0.15s linear',
          willChange: 'transform, opacity',
        }}
      >
        {images.map((src, i) => (
          <Box
            key={src}
            component="img"
            src={src}
            alt=""
            sx={{
              position: 'absolute',
              top: '-12%',
              left: '-5%',
              width: '110%',
              height: '124%',
              objectFit: 'cover',
              opacity: i === index ? 1 : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
        ))}
      </Box>

      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: STAGE_HEIGHT, minHeight: STAGE_MIN_HEIGHT, maxHeight: STAGE_MAX_HEIGHT }}>
        {images.length > 1 && (
          <>
            <IconButton
              onClick={goToPrev}
              aria-label="이전 이미지"
              sx={{
                position: 'absolute',
                left: { xs: 8, sm: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(46,42,37,0.35)',
                color: '#FFF8EC',
                '&:hover': { bgcolor: 'rgba(46,42,37,0.55)' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={goToNext}
              aria-label="다음 이미지"
              sx={{
                position: 'absolute',
                right: { xs: 8, sm: 16 },
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(46,42,37,0.35)',
                color: '#FFF8EC',
                '&:hover': { bgcolor: 'rgba(46,42,37,0.55)' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        <Box
          onClick={goToNext}
          sx={{
            position: 'absolute',
            left: { xs: 20, sm: 40 },
            bottom: { xs: 16, sm: 28 },
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            cursor: 'pointer',
            color: '#FFF8EC',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{pad(index)}</Typography>
          <Typography sx={{ fontSize: '0.85rem', opacity: 0.7 }}>/ {pad(images.length - 1)}</Typography>
        </Box>
      </Box>

      {children && (
        <Box
          ref={contentZoneRef}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: STAGE_HEIGHT,
            height: CONTENT_ZONE_HEIGHT,
            minHeight: CONTENT_ZONE_MIN_HEIGHT,
            maxHeight: CONTENT_ZONE_MAX_HEIGHT,
            opacity: contentOpacity,
            transform: `scale(${0.82 + contentOpacity * 0.18})`,
            transformOrigin: 'center center',
            transition: 'opacity 0.15s linear, transform 0.15s linear',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              pt: { xs: 6, sm: 9, md: 12 },
            }}
          >
            {children}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default HeroCarousel
