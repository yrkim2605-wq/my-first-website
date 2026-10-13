import { createTheme } from '@mui/material/styles'

// 모서리 둥글기 기준값이에요. sx의 borderRadius에 숫자(예: 3)를 쓰면
// MUI가 shape.borderRadius(14px)를 곱해 42px가 되므로, 아래 값을 문자열로 써요.
export const RADIUS = {
  sm: '8px', // 작은 아바타, 아이콘
  md: '12px', // 작은 상자, 썸네일, 메뉴
  lg: '18px', // 카드, 리뷰 · 댓글 상자, 큰 사진
  pill: 999, // 칩, 배지, 검색창
  round: '50%', // 동그란 프로필 사진
}

// 제목용 세리프 글꼴이에요. 본문(Pretendard)과 짝을 이뤄 "귀엽지만 어른스러운" 느낌을 줘요.
// sx에서 제목이 아닌 곳에 쓰고 싶을 때: sx={{ fontFamily: DISPLAY_FONT }}
export const DISPLAY_FONT = '"Noto Serif KR", serif'

const theme = createTheme({
  // 팔레트: 크림 바탕 + 와인(주인공) + 세이지 · 테라코타 · 머스터드(보조), 글자는 초콜릿 브라운
  palette: {
    primary: {
      main: '#7B2D3B', // 와인
      light: '#9A4553',
      dark: '#5A1F2A',
      contrastText: '#FBF6EA',
    },
    secondary: {
      main: '#8FA67E', // 세이지
      light: '#B4C6A6',
      dark: '#6E8560',
      contrastText: '#2F3A28',
    },
    terracotta: {
      main: '#D9735E',
      contrastText: '#FBF6EA',
    },
    mustard: {
      main: '#E2B04A',
      contrastText: '#3B2A22',
    },
    background: {
      default: '#F6EEDC', // 크림
      paper: '#FBF6EA',
    },
    text: {
      primary: '#3B2A22', // 초콜릿 브라운
      secondary: '#7A6656',
    },
    crust: {
      main: '#332419',
      light: '#5C4433',
    },
    // 레벨 칭호 · 로고 배지처럼 버터색 바탕에 갈색 글씨를 쓰는 곳
    butter: {
      main: '#F3DFAE',
      contrastText: '#6E4518',
    },
    // 획득 배지 테두리, 검색창 테두리 등 금색 강조
    gold: {
      main: '#E2B04A',
    },
    // 상단 프로모션 띠, 검색 영역 등 넓은 강조 면
    highlight: {
      main: '#E2B04A',
    },
  },
  typography: {
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: DISPLAY_FONT,
      fontSize: '2.4rem',
      fontWeight: 900, // Noto Serif KR은 900 굵기만 불러와요
      letterSpacing: '-0.01em',
      lineHeight: 1.25,
    },
    h2: {
      fontFamily: DISPLAY_FONT,
      fontSize: '1.6rem',
      fontWeight: 900, // Noto Serif KR은 900 굵기만 불러와요
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: DISPLAY_FONT,
      fontSize: '1.15rem',
      fontWeight: 900, // Noto Serif KR은 900 굵기만 불러와요
      lineHeight: 1.35,
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
          borderRadius: RADIUS.lg,
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
          borderRadius: RADIUS.lg,
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
