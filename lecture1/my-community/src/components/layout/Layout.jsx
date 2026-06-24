import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Header from './Header'

const Layout = () => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
    <Header />
    <Box component="main" sx={{ py: 4 }}>
      <Outlet />
    </Box>
  </Box>
)

export default Layout
