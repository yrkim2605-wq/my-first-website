import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { PROFILE, NAV_ITEMS } from '../../constants/profile'

const Header = () => {
  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{ bgcolor: 'background.default', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          component="a"
          href="#top"
          sx={{
            textDecoration: 'none',
            color: 'text.primary',
            fontFamily: '"Stick No Bills"',
            fontWeight: 800,
            fontSize: '20px',
            letterSpacing: '0.15em',
          }}
        >
          {PROFILE.siteName}
        </Typography>
        <Stack direction="row" spacing={1}>
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.href}
              href={item.href}
              color="inherit"
              sx={{ fontFamily: '"Alumni Sans"', fontWeight: 600, fontSize: '20px' }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}

export default Header
