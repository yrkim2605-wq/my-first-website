import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import InputBase from '@mui/material/InputBase'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'

const TopHeader = () => {
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: '#0B0B0B', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Toolbar sx={{ px: 2, minHeight: 56, gap: 1 }}>
        {showSearch ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#1A1A1A',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
            }}
          >
            <SearchRoundedIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <InputBase
              autoFocus
              placeholder="상품, 쇼핑몰, 브랜드 검색"
              fullWidth
              onBlur={() => setShowSearch(false)}
              sx={{ color: 'white', fontSize: 14 }}
            />
          </Box>
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{ flex: 1, color: '#39FF14', fontSize: 20, letterSpacing: '-0.5px' }}
            >
              HYPE FITS
            </Typography>
            <IconButton size="small" onClick={() => setShowSearch(true)} sx={{ color: 'white' }}>
              <SearchRoundedIcon />
            </IconButton>
            <IconButton size="small" sx={{ color: 'white' }}>
              <Badge badgeContent={3} color="primary">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>
            <IconButton size="small" onClick={() => navigate('/my')} sx={{ color: 'white' }}>
              <PersonOutlineRoundedIcon />
            </IconButton>
            <IconButton size="small" sx={{ color: 'white' }}>
              <Badge badgeContent={2} color="primary">
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
          </>
        )}
      </Toolbar>
    </AppBar>
  )
}

export default TopHeader
