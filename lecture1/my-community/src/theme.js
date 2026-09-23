import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#E8540C',
      light: '#F2784A',
      dark: '#B83E08',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5E6D3',
      contrastText: '#2B1A0F',
    },
    info: {
      main: '#2BB89C',
    },
    background: {
      default: '#F5E6D3',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2B1A0F',
      secondary: '#5C4A3A',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
});

export default theme;
