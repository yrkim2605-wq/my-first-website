import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#39FF14',
      contrastText: '#0B0B0B',
    },
    secondary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#0B0B0B',
      paper: '#141414',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255,255,255,0.55)',
    },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700, letterSpacing: '-0.3px' },
    subtitle1: { fontWeight: 600 },
    caption: { color: 'rgba(255,255,255,0.55)' },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: {
    MuiBottomNavigation: {
      styleOverrides: {
        root: { backgroundColor: '#0F0F0F', borderTop: '1px solid rgba(255,255,255,0.07)' },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: { color: 'rgba(255,255,255,0.4)', '&.Mui-selected': { color: '#39FF14' } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
  },
});

export default theme;
