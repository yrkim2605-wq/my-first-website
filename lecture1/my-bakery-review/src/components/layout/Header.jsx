import { useEffect, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { NavLink } from 'react-router-dom'
import mascotLogo from '../../assets/logo-mascot-photo.png'
import { COMMUNITY_CATEGORIES } from '../../constants/categories'
import { RANKING_TABS } from '../../pages/Ranking'

const NAV_ENTRIES = [
  {
    key: 'community',
    to: '/community',
    label: '커뮤니티',
    items: [
      { label: '전체 게시글', to: '/community', end: true },
      ...COMMUNITY_CATEGORIES.map((category) => ({
        label: category.label,
        to: `/community?category=${category.id}`,
      })),
    ],
  },
  { key: 'mypage', to: '/mypage', label: '마이페이지' },
  {
    key: 'ranking',
    to: '/ranking',
    label: '랭킹',
    items: RANKING_TABS.map((tab, index) => ({
      label: tab.label,
      to: `/ranking?tab=${index}`,
    })),
  },
  { key: 'login', to: '/login', label: '로그인' },
]

const NAV_LINK_SX = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#205A41',
  textDecoration: 'none',
  transition: 'color 0.15s',
  '&.active': {
    color: 'primary.main',
  },
  '&:hover': {
    color: 'primary.main',
  },
}

const DROPDOWN_ITEM_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  px: 2,
  py: 1,
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'text.primary',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'background-color 0.15s ease, color 0.15s ease',
  '&:hover': {
    bgcolor: 'rgba(32,90,65,0.08)',
    color: 'primary.main',
  },
}

const Header = () => {
  const navRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [indicator, setIndicator] = useState({ left: 0, visible: false })
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const openMenu = (key) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpenMenuKey(key)
  }

  const closeMenuDelayed = () => {
    closeTimerRef.current = setTimeout(() => setOpenMenuKey(null), 150)
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: '#FFFBF4',
        transition: 'box-shadow 0.3s ease',
        boxShadow: scrolled ? '0 6px 20px rgba(46,42,37,0.1)' : 'none',
      }}
    >
        <Toolbar
          disableGutters
          sx={{
            gap: 2,
            flexWrap: 'wrap',
            width: '100%',
            px: { xs: 3, sm: 6, lg: 9 },
            py: { xs: 2, sm: 2 },
            minHeight: { xs: 84, sm: 108 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box
            component={NavLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
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
              className="mascot-float"
              sx={{ width: 48, height: 56, flexShrink: 0, objectFit: 'contain' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography
                sx={{
                  fontFamily: '"OwnglyphParkDaHyun", cursive',
                  fontSize: '2rem',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                빵덕후
              </Typography>
              <Box
                sx={{
                  px: 1.25,
                  py: 0.3,
                  borderRadius: 999,
                  bgcolor: '#F3D9A8',
                  color: '#7A4A16',
                  fontFamily: '"OwnglyphParkDaHyun", cursive',
                  fontSize: '1.15rem',
                  lineHeight: 1.4,
                  fontWeight: 700,
                }}
              >
                레벨업
              </Box>
            </Box>
          </Box>

          <Box
            ref={navRef}
            onMouseLeave={handleLeave}
            sx={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: { xs: 3, sm: 5 } }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -12,
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
            {NAV_ENTRIES.map((entry) => {
              if (!entry.items) {
                return (
                  <Typography
                    key={entry.key}
                    component={NavLink}
                    to={entry.to}
                    onMouseEnter={handleEnter}
                    sx={NAV_LINK_SX}
                  >
                    {entry.label}
                  </Typography>
                )
              }

              const isOpen = openMenuKey === entry.key
              return (
                <Box
                  key={entry.key}
                  onMouseEnter={() => openMenu(entry.key)}
                  onMouseLeave={closeMenuDelayed}
                  sx={{ position: 'relative' }}
                >
                  <Typography
                    component={NavLink}
                    to={entry.to}
                    onMouseEnter={handleEnter}
                    sx={NAV_LINK_SX}
                  >
                    {entry.label}
                  </Typography>

                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      mt: 1,
                      minWidth: 190,
                      bgcolor: 'rgba(255,253,246,0.55)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(46,42,37,0.08)',
                      borderRadius: 1.5,
                      boxShadow: '0 12px 28px rgba(46,42,37,0.16)',
                      py: 1,
                      opacity: isOpen ? 1 : 0,
                      visibility: isOpen ? 'visible' : 'hidden',
                      pointerEvents: isOpen ? 'auto' : 'none',
                      transform: isOpen ? 'translate(-50%, 0)' : 'translate(-50%, -6px)',
                      transition: 'opacity 0.18s ease, transform 0.18s ease, visibility 0.18s',
                      zIndex: 20,
                    }}
                  >
                    {entry.items.map((item) => (
                      <Box
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        end={item.end}
                        sx={DROPDOWN_ITEM_SX}
                      >
                        {item.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Toolbar>
    </AppBar>
  )
}

export default Header
