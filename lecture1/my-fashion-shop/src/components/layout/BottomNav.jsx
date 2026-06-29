import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import StyleRoundedIcon from '@mui/icons-material/StyleRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const pathMap = ['/', '/posts', null, '/reviews', '/my']
  const currentIndex = pathMap.indexOf(location.pathname)

  const handleChange = (_, newValue) => {
    if (newValue === 2) return
    navigate(pathMap[newValue] || '/')
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        zIndex: 1200,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Fab
          size="medium"
          onClick={() => navigate('/create')}
          sx={{
            position: 'absolute',
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: '#39FF14',
            color: '#0B0B0B',
            '&:hover': { bgcolor: '#2ECC10' },
            boxShadow: '0 0 16px rgba(57,255,20,0.5)',
            zIndex: 1,
          }}
        >
          <AddRoundedIcon />
        </Fab>
        <BottomNavigation
          value={currentIndex >= 0 ? currentIndex : 0}
          onChange={handleChange}
          sx={{ height: 60, px: 1 }}
        >
          <BottomNavigationAction label="홈" icon={<HomeRoundedIcon />} />
          <BottomNavigationAction label="코디" icon={<StyleRoundedIcon />} />
          <BottomNavigationAction sx={{ visibility: 'hidden' }} />
          <BottomNavigationAction label="검색" icon={<SearchRoundedIcon />} />
          <BottomNavigationAction label="마이" icon={<PersonRoundedIcon />} />
        </BottomNavigation>
      </Box>
    </Box>
  )
}

export default BottomNav
