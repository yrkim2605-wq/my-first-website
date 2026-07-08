import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Container,
  Box,
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorMode } from '../context/ColorModeContext';
import NavHoverLabel from './NavHoverLabel';
import ScrollProgressBar from './ScrollProgressBar';
import CustomCursor from './CustomCursor';
import { useScrollHeader } from '../hooks/useScrollHeader';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About Me', path: '/about' },
  { label: 'Projects', path: '/projects' },
];

const MOBILE_NAV_QUERY = '(max-width:767px)';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useColorMode();
  const isMobileNav = useMediaQuery(MOBILE_NAV_QUERY);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { hidden, sentinelRef } = useScrollHeader();

  const currentPath = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <CustomCursor />
      <Box ref={sentinelRef} sx={{ height: 1 }} />
      <ScrollProgressBar />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}
      >
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Container
            maxWidth="md"
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}
          >
            {isMobileNav ? (
              <IconButton
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={mobileOpen}
                sx={{ position: 'absolute', left: 0, width: 44, height: 44 }}
              >
                <Box sx={{ position: 'relative', width: 22, height: 16 }}>
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: 2,
                      bgcolor: '#FFFFFF',
                      borderRadius: 1,
                      transition: 'transform 0.25s ease, top 0.25s ease',
                      top: mobileOpen ? 7 : 0,
                      transform: mobileOpen ? 'rotate(45deg)' : 'none',
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 7,
                      width: '100%',
                      height: 2,
                      bgcolor: '#FFFFFF',
                      borderRadius: 1,
                      transition: 'opacity 0.2s ease',
                      opacity: mobileOpen ? 0 : 1,
                    }}
                  />
                  <Box
                    component="span"
                    sx={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: 2,
                      bgcolor: '#FFFFFF',
                      borderRadius: 1,
                      transition: 'transform 0.25s ease, top 0.25s ease',
                      top: mobileOpen ? 7 : 14,
                      transform: mobileOpen ? 'rotate(-45deg)' : 'none',
                    }}
                  />
                </Box>
              </IconButton>
            ) : (
              <Tabs
                value={currentPath}
                onChange={(_, value) => navigate(value)}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: 'primary.light',
                  },
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Tab
                    key={item.path}
                    label={<NavHoverLabel text={item.label} />}
                    value={item.path}
                    sx={{
                      '&:hover .nav-hover-inner': {
                        transform: 'translateY(-50%)',
                      },
                    }}
                  />
                ))}
              </Tabs>
            )}

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

      <Drawer
        anchor="right"
        open={isMobileNav && mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{ paper: { sx: { width: 260, bgcolor: '#000000', color: '#FFFFFF' } } }}
      >
        <List sx={{ mt: 8 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              selected={currentPath === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                py: 2,
                px: 3,
                '&.Mui-selected': { bgcolor: 'rgba(124, 107, 255, 0.15)' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(124, 107, 255, 0.22)' },
              }}
            >
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: 700,
                      color: currentPath === item.path ? 'primary.light' : 'inherit',
                    },
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Outlet />
    </Box>
  );
}

export default Layout;
