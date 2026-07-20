import { useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/community', label: '커뮤니티' },
  { to: '/mypage', label: '마이페이지' },
  { to: '/ranking', label: '랭킹' },
]

const Header = () => {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, visible: false })

  const handleEnter = (event) => {
    const itemRect = event.currentTarget.getBoundingClientRect()
    const containerRect = navRef.current.getBoundingClientRect()
    setIndicator({
      left: itemRect.left - containerRect.left + itemRect.width / 2,
      visible: true,
    })
  }

  const handleLeave = () => {
    setIndicator((prev) => ({ ...prev, visible: false }))
  }

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.default' }}>
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{ gap: 3, flexWrap: 'wrap', pt: { xs: 3, sm: 5 }, pb: 2.5, minHeight: { xs: 'auto', sm: 88 } }}
        >
          <Typography
            component={NavLink}
            to="/"
            sx={{
              flexGrow: 1,
              fontSize: '1.7rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              textDecoration: 'none',
            }}
          >
            빵덕후 레벨업
          </Typography>
          <Box
            ref={navRef}
            onMouseLeave={handleLeave}
            sx={{ position: 'relative', display: 'flex', gap: { xs: 2.5, sm: 4 } }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -14,
                left: 0,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'text.primary',
                transform: `translateX(${indicator.left - 4}px)`,
                opacity: indicator.visible ? 1 : 0,
                transition: 'transform 0.2s ease, opacity 0.15s ease',
                pointerEvents: 'none',
              }}
            />
            {NAV_ITEMS.map((item) => (
              <Typography
                key={item.to}
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                onMouseEnter={handleEnter}
                sx={{
                  fontSize: '1.4375rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                  '&.active': {
                    color: 'primary.main',
                  },
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Header
