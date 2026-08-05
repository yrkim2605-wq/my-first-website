import { useEffect, useState } from 'react'
import Fab from '@mui/material/Fab'
import Zoom from '@mui/material/Zoom'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useLenis } from 'lenis/react'

const SHOW_AFTER_SCROLL = 400

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SHOW_AFTER_SCROLL)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    if (lenis) {
      lenis.scrollTo(0)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <Zoom in={visible}>
      <Fab
        onClick={scrollToTop}
        aria-label="맨 위로"
        sx={{
          bgcolor: '#FFE373',
          color: '#205A41',
          transition: 'background-color 0.4s ease, color 0.4s ease, transform 0.15s ease',
          '&:hover': {
            bgcolor: '#205A41',
            color: '#F0EDE6',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'scale(0.9)',
          },
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  )
}

export default ScrollToTopButton
