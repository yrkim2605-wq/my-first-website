import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const SLIDE_INTERVAL = 3500

const pad = (n) => String(n + 1).padStart(2, '0')

const HeroCarousel = ({ images }) => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [images.length])

  const goToPrev = () => setIndex((prev) => (prev - 1 + images.length) % images.length)
  const goToNext = () => setIndex((prev) => (prev + 1) % images.length)

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 320, sm: 480, md: 620 },
        overflow: 'hidden',
        borderRadius: { xs: 3, sm: 4 },
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
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === index ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}

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
  )
}

export default HeroCarousel
