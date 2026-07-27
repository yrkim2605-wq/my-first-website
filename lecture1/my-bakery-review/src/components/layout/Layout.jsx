import Box from '@mui/material/Box'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const Layout = () => {
  const location = useLocation()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Box key={location.pathname} className="page-fade">
          <Outlet />
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

export default Layout
