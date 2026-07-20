import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '홈', emoji: '🏠' },
  { to: '/community', label: '커뮤니티', emoji: '💬' },
  { to: '/mypage', label: '마이페이지', emoji: '🎒' },
  { to: '/ranking', label: '랭킹', emoji: '🏆' },
]

const Header = () => {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Typography
          variant="h6"
          component={NavLink}
          to="/"
          sx={{
            flexGrow: 1,
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'text.primary',
            textDecoration: 'none',
          }}
        >
          🍞 빵덕후 레벨업
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                color: 'text.primary',
                boxShadow: 'none',
                '&.active': {
                  bgcolor: 'rgba(255,255,255,0.5)',
                },
                '&:hover': { boxShadow: 'none', transform: 'none', bgcolor: 'rgba(255,255,255,0.3)' },
                '&:active': { transform: 'none', boxShadow: 'none' },
              }}
            >
              {item.emoji} {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
