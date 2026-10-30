import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/500.css'
import '@fontsource/noto-sans-kr/700.css'
import App from './App.jsx'
import theme from './theme.js'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { ShopProvider } from './context/ShopProvider.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ShopProvider>
          <App />
        </ShopProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
)
