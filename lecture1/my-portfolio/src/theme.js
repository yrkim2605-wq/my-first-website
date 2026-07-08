import { createTheme } from '@mui/material/styles';

// 다크 모드가 기본 브랜드 정체성 — 블랙 배경 + 인디고/바이올렛 포인트
export const darkColors = {
  primary: '#4F3CF2',
  primaryLight: '#7C6BFF',
  primaryDark: '#3617CE',
  secondary: '#7C6BFF',
  accent: '#7C6BFF',
  bgPrimary: '#000000',
  bgSecondary: '#0D0D14',
  textPrimary: '#F5F5F7',
  textSecondary: 'rgba(245, 245, 247, 0.65)',
  textMuted: 'rgba(245, 245, 247, 0.4)',
  buttonPrimary: '#4F3CF2',
  buttonHover: '#7C6BFF',
  link: '#7C6BFF',
  linkHover: '#9C90FF',
};

// 라이트 모드 - 같은 인디고 아이덴티티를 화이트 배경 위에 적용
export const colors = {
  primary: '#4F3CF2',
  primaryLight: '#7C6BFF',
  primaryDark: '#3617CE',
  secondary: '#7C6BFF',
  accent: '#4F3CF2',
  bgPrimary: '#F5F5F8',
  bgSecondary: '#FFFFFF',
  textPrimary: '#0A0A0F',
  textSecondary: '#54545F',
  textMuted: '#8A8A96',
  buttonPrimary: '#4F3CF2',
  buttonHover: '#3617CE',
  link: '#4F3CF2',
  linkHover: '#3617CE',
};

export const displayFontFamily =
  '"Pretendard Variable", "Pretendard", "Roboto", "Helvetica", "Arial", sans-serif';

export function buildTheme(mode = 'dark') {
  const palette = mode === 'dark' ? darkColors : colors;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.primary,
        light: palette.primaryLight,
        dark: palette.primaryDark,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: palette.accent,
        contrastText: '#FFFFFF',
      },
      background: {
        default: palette.bgPrimary,
        paper: palette.bgSecondary,
      },
      text: {
        primary: palette.textPrimary,
        secondary: palette.textSecondary,
        disabled: palette.textMuted,
      },
    },
    typography: {
      fontFamily: displayFontFamily,
      h1: {
        fontFamily: displayFontFamily,
        fontSize: '2.125rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: displayFontFamily,
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily: displayFontFamily,
        fontWeight: 800,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontFamily: displayFontFamily,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontFamily: displayFontFamily,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: displayFontFamily,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: palette.buttonHover,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: displayFontFamily,
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: palette.link,
            '&:hover': {
              color: palette.linkHover,
            },
          },
        },
      },
    },
  });
}

const theme = buildTheme('dark');

export default theme;
