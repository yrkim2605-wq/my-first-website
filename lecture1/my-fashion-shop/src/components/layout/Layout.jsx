import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopHeader from './TopHeader'
import BottomNav from './BottomNav'

const Layout = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100svh' }}>
      <TopHeader />
      <Box sx={{ pb: '76px' }}>
        <Outlet />
      </Box>
      <BottomNav />
    </Box>
  )
}

export default Layout
