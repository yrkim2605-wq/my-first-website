import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// Text fills from dim to bright as it scrolls up through the viewport,
// like the color-fill headlines on agency landing pages.
const ScrollFillText = ({
  children,
  dimColor = 'rgba(255,251,244,0.28)',
  fillColor = '#FFFBF4',
  startAt = 0.92,
  endAt = 0.42,
  sx,
}) => {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let ticking = false

    const update = () => {
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const viewportH = window.innerHeight
      const start = viewportH * startAt
      const end = viewportH * endAt
      const next = clamp((start - rect.top) / (start - end), 0, 1)
      setProgress(next)
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
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [startAt, endAt])

  const stop = `${progress * 100}%`

  return (
    <Box
      ref={ref}
      component="span"
      sx={{
        backgroundImage: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${stop}, ${dimColor} ${stop}, ${dimColor} 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

export default ScrollFillText
