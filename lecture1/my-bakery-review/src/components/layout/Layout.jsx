import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTopButton from '../common/ScrollToTopButton'

const Layout = () => {
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component={Link}
        to="/signup"
        sx={{
          minHeight: 38,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 0.75,
          textDecoration: 'none',
          '&:hover .promo-banner-cta': { textDecorationColor: 'currentColor' },
        }}
      >
        <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.85rem' }, textAlign: 'center' }}>
          지금 가입하고 레벨업 혜택을 받아보세요{' '}
          <Box
            component="span"
            className="promo-banner-cta"
            sx={{
              fontWeight: 700,
              color: 'mustard.main',
              textDecoration: 'underline',
              textDecorationColor: 'transparent',
              textUnderlineOffset: 3,
              transition: 'text-decoration-color 0.15s ease',
            }}
          >
            회원가입 →
          </Box>
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
      {/* 레벨 정보는 헤더로 옮겼어요. 화면에 떠 있는 건 "맨 위로" 버튼 하나뿐이에요. */}
      <Box sx={{ position: 'fixed', right: { xs: 16, sm: 28 }, bottom: { xs: 16, sm: 28 }, zIndex: 1200 }}>
        <ScrollToTopButton />
      </Box>
    </Box>
  )
}

export default Layout
