# 코드 컨벤션 가이드

## 파일 및 폴더 구조

```
src/
├── components/       # 재사용 컴포넌트
│   ├── common/      # 공통 컴포넌트
│   └── layout/      # 레이아웃 컴포넌트
├── pages/           # 페이지 컴포넌트
├── hooks/           # 커스텀 훅
├── utils/           # 유틸리티 함수
├── constants/       # 상수
├── theme.js         # MUI 테마 설정
└── main.jsx         # 앱 진입점
```

## 네이밍 규칙

### 컴포넌트
- PascalCase 사용: `UserProfile`, `NavBar`, `ProductCard`
- 파일명 = 컴포넌트명: `UserProfile.jsx`

### 함수/변수
- camelCase 사용: `getUserData`, `isLoading`, `handleSubmit`
- 이벤트 핸들러: `handle` 접두사 사용: `handleClick`, `handleSubmit`
- 불리언: `is`, `has`, `can` 접두사: `isVisible`, `hasError`

### 상수
- UPPER_SNAKE_CASE: `MAX_RETRY_COUNT`, `API_BASE_URL`

### CSS 클래스 (styled-components/sx prop)
- camelCase in sx prop: `{ fontSize: '1rem', fontWeight: 500 }`

## React 컴포넌트 작성 규칙

### 기본 구조
```jsx
import React from 'react'
import { Box, Typography } from '@mui/material'

const ComponentName = ({ prop1, prop2 }) => {
  return (
    <Box>
      <Typography>{prop1}</Typography>
    </Box>
  )
}

export default ComponentName
```

### Props 순서
1. 데이터 관련 props
2. 이벤트 핸들러
3. 스타일 관련 (sx, style, className)

### Hooks 규칙
- 컴포넌트 최상단에서만 호출
- 조건문, 반복문 내부에서 사용 금지
- 커스텀 훅은 `use` 접두사: `useAuth`, `useFetch`

## MUI 사용 규칙

### sx prop 우선
- inline style 대신 sx prop 사용
- theme 값 활용: `sx={{ color: 'primary.main', mt: 2 }}`

### 컴포넌트 임포트
```jsx
// 개별 임포트 (권장 - 트리쉐이킹)
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// 또는 구조분해 임포트
import { Button, TextField } from '@mui/material'
```

## Git 커밋 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
style: 코드 스타일 변경 (로직 변경 없음)
refactor: 코드 리팩토링
docs: 문서 수정
chore: 빌드, 설정 변경
```
