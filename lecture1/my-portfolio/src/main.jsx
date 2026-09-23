import React from 'react'
import ReactDOM from 'react-dom/client'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import App from './App.jsx'
import { ColorModeProvider } from './context/ColorModeContext.jsx'
import { PortfolioProvider } from './context/PortfolioContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeProvider>
      <PortfolioProvider>
        <App />
      </PortfolioProvider>
    </ColorModeProvider>
  </React.StrictMode>,
)
