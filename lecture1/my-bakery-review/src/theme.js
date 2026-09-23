import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#205A41',
      light: '#3D7A5C',
      dark: '#123B29',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D9AFA0',
      light: '#EAC9C1',
      dark: '#B98576',
      contrastText: '#1C130C',
    },
    background: {
      default: '#F7F1E6',
      paper: '#FFFBF4',
    },
    text: {
      primary: '#2E2A25',
      secondary: '#7A7268',
    },
    crust: {
      main: '#332419',
      light: '#5C4433',
    },
  },
  typography: {
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Helvetica, Arial, sans-serif',
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
    borderRadius: 14,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, background-color 0.15s ease',
          '&:hover': {
            boxShadow: '0 8px 18px rgba(51,36,25,0.18)',
            opacity: 0.92,
            transform: 'translateY(-1px)',
          },
          '&:active': {
            opacity: 0.85,
            transform: 'scale(0.97)',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(46,42,37,0.07)',
          boxShadow: '0 2px 10px rgba(51,36,25,0.06)',
          transition: 'transform 0.15s ease',
          '&:active': {
            transform: 'scale(0.985)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease, background-color 0.15s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'scale(0.88)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
          transition: 'transform 0.15s ease, background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
          '&:active': {
            transform: 'scale(0.94)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
          borderRadius: 0,
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
          backgroundColor: '#332419',
        },
      },
    },
  },
})

export default theme
