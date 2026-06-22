import { createTheme } from '@mui/material/styles';

// 컬러 팔레트 디자인 시스템.md의 CSS 변수를 그대로 매핑
export const colors = {
  primary: '#E8540C',
  primaryLight: '#F2784A',
  primaryDark: '#B83E08',
  secondary: '#F5E6D3',
  accent: '#2BB89C',
  bgPrimary: '#F5E6D3',
  bgSecondary: '#FFFFFF',
  textPrimary: '#2B1A0F',
  textSecondary: '#5C4A3A',
  textMuted: '#8C7A6A',
  buttonPrimary: '#E8540C',
  buttonHover: '#C8460A',
  link: '#2BB89C',
  linkHover: '#1F9580',
};

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.accent,
      contrastText: '#FFFFFF',
    },
    background: {
      default: colors.bgPrimary,
      paper: colors.bgSecondary,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textMuted,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.125rem',
      fontWeight: 500,
    },
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          '&:hover': {
            backgroundColor: colors.buttonHover,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.link,
          '&:hover': {
            color: colors.linkHover,
          },
        },
      },
    },
  },
});

export default theme;
