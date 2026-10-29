import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // lg = 콘텐츠 최대 너비. 모든 섹션이 <Container maxWidth="lg">를 쓰므로 여기서 바꾸면 좌우 정렬선이 함께 바뀜
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1360, xl: 1600 },
  },
  palette: {
    primary: {
      main: '#F26A1B',
      light: '#FF8A4A',
      dark: '#D4540A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#111111',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#222222',
      secondary: '#666666',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.3 },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 700 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { fontWeight: 500, textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

export default theme;
