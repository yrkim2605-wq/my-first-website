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
          bgcolor: '#FFE373',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            bgcolor: '#205A41',
          },
          '&:hover .promo-banner-text': {
            color: '#FFE373',
          },
        }}
      >
        <Typography
          className="promo-banner-text"
          sx={{
            color: '#205A41',
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
          <Outlet />
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
