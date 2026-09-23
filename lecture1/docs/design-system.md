# 디자인 시스템 가이드

## 색상 팔레트

### Primary Colors
- Primary Main: `#1976d2` (MUI Blue)
- Primary Light: `#42a5f5`
- Primary Dark: `#1565c0`

### Secondary Colors
- Secondary Main: `#dc004e` (MUI Pink)
- Secondary Light: `#ff4081`
- Secondary Dark: `#9a0036`

### Neutral Colors
- Background: `#ffffff`
- Surface: `#f5f5f5`
- Text Primary: `rgba(0, 0, 0, 0.87)`
- Text Secondary: `rgba(0, 0, 0, 0.6)`

## 타이포그래피

### Font Family
- 기본: `"Roboto", "Helvetica", "Arial", sans-serif`
- 한국어: `"Noto Sans KR", sans-serif`

### Font Scale
| 레벨 | 크기 | 두께 | 용도 |
|------|------|------|------|
| h1 | 2.125rem | 500 | 페이지 제목 |
| h2 | 1.5rem | 500 | 섹션 제목 |
| h3 | 1.25rem | 500 | 서브 섹션 |
| body1 | 1rem | 400 | 본문 텍스트 |
| body2 | 0.875rem | 400 | 보조 텍스트 |
| caption | 0.75rem | 400 | 캡션 |

## 간격 (Spacing)
- Base Unit: 8px
- xs: 4px (0.5x)
- sm: 8px (1x)
- md: 16px (2x)
- lg: 24px (3x)
- xl: 32px (4x)

## 컴포넌트 가이드

### 버튼
- Primary: `variant="contained"` color="primary"
- Secondary: `variant="outlined"` color="secondary"
- Text: `variant="text"`

### 카드
- 기본 elevation: 2
- 호버 elevation: 4
- Border radius: 8px

### 그리드 시스템
- 12 컬럼 그리드
- Breakpoints: xs(0), sm(600), md(900), lg(1200), xl(1536)
