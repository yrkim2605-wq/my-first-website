import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      dark: '#111111',
    },
    text: {
      primary: '#111111',
      secondary: '#949494',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    accent: {
      main: '#FFFBE6',
    },
  },
  typography: {
    fontFamily: '"Alumni Sans", "Inter", "Helvetica", "Arial", sans-serif',
    fontWeightRegular: 600,
    display: {
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      textTransform: 'uppercase',
    },
    logo: {
      fontFamily: '"Stick No Bills", sans-serif',
      fontWeight: 800,
    },
    body: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
    },
  },
  spacing: 8,
});

export default theme;
