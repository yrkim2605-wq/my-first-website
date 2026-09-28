import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import '@fontsource/anton'
import '@fontsource/alumni-sans/400.css'
import '@fontsource/alumni-sans/600.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/stick-no-bills/400.css'
import '@fontsource/stick-no-bills/800.css'
import AboutMe from './pages/AboutMe.jsx'
import theme from './theme.js'
import './index.css'

// 자기소개 페이지(about.html)의 진입점
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AboutMe />
    </ThemeProvider>
  </React.StrictMode>,
)
