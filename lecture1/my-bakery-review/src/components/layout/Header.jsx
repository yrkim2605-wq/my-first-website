import { useEffect, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { NavLink } from 'react-router-dom'
import mascotLogo from '../../assets/logo-mascot-photo.webp'
import HeaderLevelBadge from './HeaderLevelBadge'
import { COMMUNITY_CATEGORIES } from '../../constants/categories'
import { RANKING_TABS } from '../../constants/ranking'
import { RADIUS } from '../../theme'

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
]

// 현재 페이지 메뉴 아래에 그리는 머스터드색 물결 밑줄
const WAVE_UNDERLINE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 8'%3E%3Cpath d='M2 4 Q 7 0, 12 4 T 22 4 T 32 4 T 42 4' fill='none' stroke='%23E2B04A' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")"

const NAV_LINK_SX = {
  position: 'relative',
  display: 'inline-block',
  py: 0.75,
  fontSize: { xs: '0.95rem', sm: '1rem' },
  fontWeight: 700,
  color: 'text.primary',
  textDecoration: 'none',
  transition: 'color 0.15s',
  '&:hover': { color: 'primary.main' },
  '&.active': { color: 'primary.main' },
  '&.active::after': {
    content: '""',
    position: 'absolute',
    left: '50%',
    bottom: -6,
    width: 32,
    height: 7,
    transform: 'translateX(-50%)',
    backgroundImage: WAVE_UNDERLINE,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
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
    bgcolor: 'rgba(123,45,59,0.07)',
    color: 'primary.main',
  },
}

const Header = () => {
  const closeTimerRef = useRef(null)
  const [openMenuKey, setOpenMenuKey] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: scrolled ? 'rgba(59,42,34,0.1)' : 'transparent',
        transition: 'border-color 0.3s ease',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          px: { xs: 2.5, sm: 6, lg: 9 },
          py: { xs: 1.5, md: 1.25 },
          minHeight: { xs: 64, md: 80 },
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: { xs: 2, md: 5 },
          rowGap: 1,
        }}
      >
        <Box
          component={NavLink}
          to="/"
          aria-label="빵덕후 레벨업 홈"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
        >
          <Box
            component="img"
            src={mascotLogo}
            alt=""
            sx={{ width: { xs: 36, md: 42 }, height: { xs: 42, md: 49 }, flexShrink: 0, objectFit: 'contain' }}
          />
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, fontFamily: '"OwnglyphParkDaHyun", cursive', lineHeight: 1 }}>
            <Box component="span" sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, color: 'primary.main' }}>
              빵덕후
            </Box>
            <Box component="span" sx={{ fontSize: { xs: '1.15rem', md: '1.3rem' }, color: 'terracotta.main' }}>
              레벨업
            </Box>
          </Box>
        </Box>

        <Box
          component="nav"
          aria-label="주 메뉴"
          sx={{
            order: { xs: 3, md: 0 },
            width: { xs: '100%', md: 'auto' },
            ml: { md: 'auto' },
            display: 'flex',
            gap: { xs: 3, md: 4 },
          }}
        >
          {NAV_ENTRIES.map((entry) => {
            if (!entry.items) {
              return (
                <Typography key={entry.key} component={NavLink} to={entry.to} sx={NAV_LINK_SX}>
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
                <Typography component={NavLink} to={entry.to} sx={NAV_LINK_SX}>
                  {entry.label}
                </Typography>

                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    mt: 1.5,
                    minWidth: 190,
                    bgcolor: 'background.paper',
                    border: '1px solid rgba(59,42,34,0.1)',
                    borderRadius: RADIUS.md,
                    boxShadow: '0 12px 28px rgba(59,42,34,0.12)',
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
                    <Box key={item.to} component={NavLink} to={item.to} end={item.end} sx={DROPDOWN_ITEM_SX}>
                      {item.label}
                    </Box>
                  ))}
                </Box>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ ml: { xs: 'auto', md: 0 }, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <HeaderLevelBadge />
          <Button
            component={NavLink}
            to="/login"
            variant="contained"
            color="secondary"
            size="small"
            sx={{ borderRadius: RADIUS.pill, px: 2, py: 0.75, fontWeight: 700, boxShadow: 'none' }}
          >
            로그인
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
