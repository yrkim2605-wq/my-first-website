import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/community', label: '커뮤니티' },
  { to: '/mypage', label: '마이페이지' },
  { to: '/ranking', label: '랭킹' },
]

const Header = () => {
  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.default' }}>
      <Toolbar sx={{ gap: 3, flexWrap: 'wrap', py: 2.5, minHeight: { xs: 'auto', sm: 88 } }}>
        <Typography
          component={NavLink}
          to="/"
          sx={{
            flexGrow: 1,
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            textDecoration: 'none',
          }}
        >
          빵덕후 레벨업
        </Typography>
        <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 4 } }}>
          {NAV_ITEMS.map((item) => (
            <Typography
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'text.primary',
                textDecoration: 'none',
                transition: 'color 0.15s',
                '&.active': {
                  color: 'primary.main',
                },
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
