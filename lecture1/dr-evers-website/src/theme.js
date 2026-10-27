import { createTheme } from '@mui/material/styles';

const SANS_FONT = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const SERIF_FONT = '"Playfair Display", "Noto Serif KR", serif';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00918f',
      light: '#6cc5bf',
      dark: '#0b4f4a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1b2b2a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      tint: '#e6f6f4',
    },
    text: {
      primary: '#1b2b2a',
      secondary: '#5d6e6c',
    },
    divider: '#d6e6e4',
  },
  typography: {
    fontFamily: SANS_FONT,
    fontFamilySerif: SERIF_FONT,
    h1: { fontSize: '3.25rem', fontWeight: 600, lineHeight: 1.25 },
    h2: {
      fontFamily: SERIF_FONT,
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#0b4f4a',
    },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.35 },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  spacing: 8,
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, padding: '10px 24px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 24, boxShadow: '0 8px 32px rgba(15, 143, 137, 0.12)' },
      },
    },
  },
});

export default theme;
