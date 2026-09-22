import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      dark: '#111111',
    },
    secondary: {
      main: '#FFFBE6',
    },
    background: {
      default: '#ffffff',
      paper: '#f5f5f5',
    },
    text: {
      primary: '#000000',
      secondary: '#949494',
    },
  },
  typography: {
    fontFamily: '"Alumni Sans", "Inter", "Noto Sans KR", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 2,
      },
    },
  },
})

export default theme
