import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#A9805C',
      light: '#C9A67D',
      dark: '#7C5A3E',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D9AFA0',
      light: '#EAC9C1',
      dark: '#B98576',
      contrastText: '#3A2E24',
    },
    background: {
      default: '#FAF8F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2E2A25',
      secondary: '#7A7268',
    },
    crust: {
      main: '#7C5A3E',
      light: '#C9A67D',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.6rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.15rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'background-color 0.15s, opacity 0.15s',
          '&:hover': {
            boxShadow: 'none',
            opacity: 0.9,
          },
          '&:active': {
            opacity: 0.8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(46,42,37,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(46,42,37,0.08)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 999,
          backgroundColor: '#F1ECE4',
        },
        bar: {
          borderRadius: 999,
          backgroundColor: '#A9805C',
        },
      },
    },
  },
})

export default theme
