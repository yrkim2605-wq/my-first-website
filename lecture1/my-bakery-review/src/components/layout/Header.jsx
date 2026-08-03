import { useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { NavLink, useLocation } from 'react-router-dom'
import mascotLogo from '../../assets/logo-mascot-photo.png'
import heroGinghamBg from '../../assets/hero/gingham-bg.jpg'
import HeaderLevelBadge from './HeaderLevelBadge'

const NAV_ITEMS = [
  { to: '/community', label: '커뮤니티' },
  { to: '/mypage', label: '마이페이지' },
  { to: '/ranking', label: '랭킹' },
  { to: '/login', label: '로그인' },
]

const Header = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'
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
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        ...(isHome && {
          backgroundImage: `url(${heroGinghamBg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: { xs: '40px 40px', sm: '56px 56px' },
          backgroundAttachment: 'fixed',
          backgroundPosition: 'top left',
        }),
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 999,
            boxShadow: '0 6px 20px rgba(46,42,37,0.12)',
            px: { xs: '36px', sm: '48px' },
          }}
        >
        <Toolbar
          disableGutters
          sx={{
            gap: 3,
            flexWrap: 'wrap',
            py: { xs: 1.5, sm: 0 },
            minHeight: { xs: 'auto', sm: 88 },
            display: { xs: 'flex', sm: 'grid' },
            gridTemplateColumns: { sm: 'minmax(0, 1fr) auto minmax(0, 1fr)' },
            alignItems: 'center',
          }}
        >
          <Box
            component={NavLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              justifySelf: 'start',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'transform 0.15s ease',
              '&:hover': { transform: 'translateY(-1px)' },
            }}
          >
            <Box
              component="img"
              src={mascotLogo}
              alt=""
              sx={{ width: 44, height: 52, flexShrink: 0, objectFit: 'contain' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                sx={{
                  fontFamily: '"OwnglyphParkDaHyun", cursive',
                  fontSize: '1.9rem',
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                빵덕후
              </Typography>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.25,
                  borderRadius: 999,
                  bgcolor: '#F3D9A8',
                  color: '#7A4A16',
                  fontFamily: '"OwnglyphParkDaHyun", cursive',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                }}
              >
                레벨업
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifySelf: 'center' }}>
            <HeaderLevelBadge />
          </Box>

          <Box
            ref={navRef}
            onMouseLeave={handleLeave}
            sx={{ position: 'relative', display: 'flex', gap: { xs: 2.5, sm: 4 }, justifySelf: 'end' }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -14,
                left: 0,
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#205A41',
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
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#205A41',
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
        </Box>
      </Container>
    </AppBar>
  )
}

export default Header
