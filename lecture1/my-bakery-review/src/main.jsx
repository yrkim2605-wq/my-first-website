import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.jsx'
import theme from './theme.js'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@fontsource/noto-serif-kr/900.css'
import '@fontsource/gaegu/700.css'
import './index.css'
import { captureAuthCallbackError } from './lib/authCallback'
import { IS_ACCOUNT_MODE } from './lib/backend'

// 이메일 링크가 오류와 함께 돌아온 경우, 라우터가 시작되기 전에 처리해요 (계정 모드에서만)
if (IS_ACCOUNT_MODE) captureAuthCallbackError()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
