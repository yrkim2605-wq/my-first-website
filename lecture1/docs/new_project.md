# 새 프로젝트 시작 가이드

## 빠른 시작 (템플릿 사용)

`_template_settings` 폴더를 복사하여 새 프로젝트를 시작합니다.

```bash
# lecture1 디렉토리에서
cp -r _template_settings my-new-project
cd my-new-project
npm install
npm run dev
```

## 프로젝트 초기 설정 체크리스트

### 1. 프로젝트 생성
- [ ] `_template_settings` 복사
- [ ] 폴더명 변경 (프로젝트명으로)
- [ ] `package.json`의 `name` 필드 수정

### 2. 테마 커스터마이징 (`src/theme.js`)
- [ ] Primary 색상 설정
- [ ] Secondary 색상 설정
- [ ] 폰트 패밀리 설정
- [ ] 간격(spacing) 확인

### 3. 라우터 설정 (`src/main.jsx` 또는 `src/App.jsx`)
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 4. 디렉토리 구조 생성
```bash
mkdir -p src/components/common
mkdir -p src/components/layout
mkdir -p src/pages
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/constants
```

### 5. 레이아웃 컴포넌트 생성
- [ ] `src/components/layout/Header.jsx`
- [ ] `src/components/layout/Footer.jsx`
- [ ] `src/components/layout/Layout.jsx`

## 자주 쓰는 MUI 패턴

### 반응형 그리드
```jsx
import Grid from '@mui/material/Grid'

<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    {/* 컨텐츠 */}
  </Grid>
</Grid>
```

### 중앙 정렬 컨테이너
```jsx
import { Container, Box } from '@mui/material'

<Container maxWidth="lg">
  <Box sx={{ py: 4 }}>
    {/* 컨텐츠 */}
  </Box>
</Container>
```

### 다크모드 토글
```jsx
import { createTheme } from '@mui/material/styles'
const theme = createTheme({
  palette: {
    mode: 'light', // 'dark'로 변경
  }
})
```

## 개발 서버 실행

```bash
npm run dev      # 개발 서버 (기본 포트: 5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과물 미리보기
```

## 환경변수 설정

`.env` 파일 생성:
```
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=내 앱 이름
```

사용:
```jsx
const apiUrl = import.meta.env.VITE_API_URL
```
