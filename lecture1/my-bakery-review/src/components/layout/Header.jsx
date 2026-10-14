import { useEffect, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../../assets/logo.webp'
import HeaderLevelBadge from './HeaderLevelBadge'
import WoodButton from '../common/WoodButton'
import { useProfile } from '../../hooks/useProfile'
import { COMMUNITY_CATEGORIES } from '../../constants/categories'
import { ACTIVE_RANKING_TABS } from '../../constants/rankingTabs'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
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
  { key: 'mypage', to: '/mypage', label: '내 모험가' },
  {
    key: 'ranking',
    to: '/ranking',
    label: '명예의 전당',
    items: ACTIVE_RANKING_TABS.map((tab, index) => ({
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
  display: 'inline-flex',
  alignItems: 'center',
  py: 0.75,
  // 손가락(터치) 기기에서는 메뉴 한 칸이 최소 44px예요
  '@media (pointer: coarse)': { minHeight: 44, minWidth: 44, justifyContent: 'center' },
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
  const navigate = useNavigate()
  const { profile, signOut } = useProfile()
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
        bgcolor: 'parchment.light',
        color: 'text.primary',
        // 헤더 아래에 매달린 나무 몰딩 (가로 나뭇결 + 위쪽 빛). 스크롤하면 그림자가 생겨요.
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -6,
          height: 6,
          pointerEvents: 'none',
          backgroundColor: '#6b4423',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 9px), linear-gradient(180deg, rgba(255,220,160,0.3), transparent 60%)',
          borderBottom: '2px solid #3e2713',
          boxShadow: scrolled ? '0 6px 12px rgba(51,36,25,0.18)' : 'none',
          transition: 'box-shadow 0.3s ease',
        },
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
          sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <Box
            component="img"
            src={logo}
            alt="빵덕후 레벨업"
            sx={{ height: { xs: 52, md: 72 }, width: 'auto', display: 'block' }}
          />
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
                    ...PARCHMENT_SX,
                    borderRadius: RADIUS.md,
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
          {/* 임시 로컬 프로필: 로그아웃은 프로필과 기록을 지우지 않고 "지금 사용 중"만 해제해요 */}
          {profile ? (
            <WoodButton
              size="sm"
              showStar={false}
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
            >
              로그아웃
            </WoodButton>
          ) : (
            <WoodButton component={NavLink} to="/login" size="sm" showStar={false}>
              로그인
            </WoodButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
