import { AppBar, Toolbar, Tabs, Tab, Container, Box } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About Me', path: '/about' },
  { label: 'Projects', path: '/projects' },
];

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = NAV_ITEMS.some((item) => item.path === location.pathname)
    ? location.pathname
    : '/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center' }}>
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
          </Container>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Box>
  );
}

export default Layout;
