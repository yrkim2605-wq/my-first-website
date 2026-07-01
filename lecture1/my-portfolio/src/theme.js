import { createTheme } from '@mui/material/styles';

// 컬러 팔레트 디자인 시스템.md의 CSS 변수를 그대로 매핑 (라이트 모드 기본값)
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

// 다크 모드 팔레트 - 빵집 브랜드 오렌지/크림 톤은 유지하되 배경을 반전
export const darkColors = {
  primary: '#F2784A',
  primaryLight: '#F9A374',
  primaryDark: '#E8540C',
  secondary: '#3A2A1C',
  accent: '#3ECBAA',
  bgPrimary: '#1C1410',
  bgSecondary: '#2A1F17',
  textPrimary: '#F5E6D3',
  textSecondary: '#C9B8A8',
  textMuted: '#8C7A6A',
  buttonPrimary: '#F2784A',
  buttonHover: '#F9A374',
  link: '#3ECBAA',
  linkHover: '#6BE0C4',
};

// gdweb.co.kr 수상작 동방푸드(dongbangfood.com)의 굵은 콘덴스드 영문 헤드라인 스타일 참고
export const displayFontFamily = '"Anton", "Roboto", "Helvetica", "Arial", sans-serif';

export function buildTheme(mode = 'light') {
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
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: displayFontFamily,
        fontSize: '2.125rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
      },
      h2: {
        fontFamily: displayFontFamily,
        letterSpacing: '0.02em',
      },
      h3: {
        fontFamily: displayFontFamily,
        letterSpacing: '0.02em',
      },
      h4: {
        fontFamily: displayFontFamily,
        letterSpacing: '0.02em',
      },
    },
    spacing: 8,
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: displayFontFamily,
            letterSpacing: '0.03em',
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
            letterSpacing: '0.04em',
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

const theme = buildTheme('light');

export default theme;
