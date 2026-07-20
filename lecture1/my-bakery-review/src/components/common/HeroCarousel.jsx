import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

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

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 320, sm: 480, md: 620 },
        overflow: 'hidden',
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

      <Box
        onClick={() => setIndex((index + 1) % images.length)}
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
