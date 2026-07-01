import { AppBar, Toolbar, Tabs, Tab, Container, Box, IconButton, Tooltip } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../context/ColorModeContext';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About Me', path: '/about' },
  { label: 'Projects', path: '/projects' },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useColorMode();
  const currentPath = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : '/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <Tabs
              value={currentPath}
              onChange={(_, value) => navigate(value)}
              textColor="primary"
              indicatorColor="primary"
            >
              {NAV_ITEMS.map((item) => (
                <Tab key={item.path} label={item.label} value={item.path} />
              ))}
            </Tabs>
            <Tooltip title={mode === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
              <IconButton
                onClick={toggleColorMode}
                color="primary"
                sx={{ position: 'absolute', right: 0 }}
                aria-label="색상 모드 전환"
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Container>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
}

export default Layout;
