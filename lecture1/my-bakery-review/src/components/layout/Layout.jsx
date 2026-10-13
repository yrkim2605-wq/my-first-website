import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import HeaderLevelBadge from './HeaderLevelBadge'
import ScrollToTopButton from '../common/ScrollToTopButton'

const Layout = () => {
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component={Link}
        to="/signup"
        sx={{
          height: 50,
          bgcolor: 'highlight.main',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            bgcolor: 'primary.main',
          },
          '&:hover .promo-banner-text': {
            color: 'highlight.main',
          },
        }}
      >
        <Typography
          className="promo-banner-text"
          sx={{
            color: 'primary.main',
            fontWeight: 700,
            fontSize: { xs: '0.75rem', sm: '0.9rem' },
            textAlign: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          지금 회원가입을 하고, 레벨업을 통해 혜택을 받아보세요!
        </Typography>
      </Box>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Box key={location.pathname} className="page-fade">
          {/* 페이지 파일을 불러오는 동안 푸터가 위로 튀지 않도록 빈 공간을 잡아둬요 */}
          <Suspense fallback={<Box sx={{ minHeight: '60vh' }} />}>
            <Outlet />
          </Suspense>
        </Box>
      </Box>
      <Footer />
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 16, sm: 28 },
          bottom: { xs: 16, sm: 28 },
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1.5,
        }}
      >
        <ScrollToTopButton />
        <HeaderLevelBadge />
      </Box>
    </Box>
  )
}

export default Layout
