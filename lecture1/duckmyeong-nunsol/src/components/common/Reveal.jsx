import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'

// "동작 줄이기"를 켰거나 IntersectionObserver를 못 쓰는 환경에서는 효과 없이 바로 보여줌
const shouldSkipAnimation = () =>
  typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 화면에 들어오면 아래에서 살짝 올라오며 나타나는 효과 (한 번만 실행)
const Reveal = ({ children }) => {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(shouldSkipAnimation)

  useEffect(() => {
    if (isVisible) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : 'translateY(24px)',
        transition: 'opacity .6s ease, transform .6s ease',
      }}
    >
      {children}
    </Box>
  )
}

export default Reveal
