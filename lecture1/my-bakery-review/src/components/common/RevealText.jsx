import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'

const RevealText = ({ text, component = 'span', charDelay = 0.035, sx }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const chars = Array.from(text)

  return (
    <Box component={component} ref={ref} sx={{ display: 'inline-block', overflow: 'hidden', ...sx }}>
      {chars.map((char, index) => (
        <Box
          key={`${char}-${index}`}
          component="span"
          sx={{
            display: 'inline-block',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(110%)',
            transition: `opacity 0.5s ease ${index * charDelay}s, transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * charDelay}s`,
          }}
        >
          {char === ' ' ? ' ' : char}
        </Box>
      ))}
    </Box>
  )
}

export default RevealText
