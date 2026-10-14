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
import ErrorBoundary from './components/common/ErrorBoundary'
import { installGlobalErrorLogging } from './utils/reportClientError'

// 이메일 링크가 오류와 함께 돌아온 경우, 라우터가 시작되기 전에 처리해요 (계정 모드에서만)
if (IS_ACCOUNT_MODE) captureAuthCallbackError()

// 잡히지 않은 오류도 기록을 남겨요 (화면은 그대로예요)
installGlobalErrorLogging()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 맨 바깥 안전망: 앱 전체가 무너져도 하얀 화면 대신 안내를 보여줘요 */}
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
)
