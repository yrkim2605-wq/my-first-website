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
import ProjectDetail from './pages/ProjectDetail.jsx'
import { PROJECT_DETAILS } from './components/project-detail/projectDetails.js'
import theme from './theme.js'
import './index.css'

// Dr.Jart+ 리디자인 케이스 스터디 페이지(project-drjart.html)의 진입점
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ProjectDetail project={PROJECT_DETAILS.drjart} />
    </ThemeProvider>
  </React.StrictMode>,
)
