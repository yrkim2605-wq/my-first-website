import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingMenu from './components/layout/FloatingMenu'
import HomePage from './pages/HomePage'
import QuotePage from './pages/QuotePage'
import useProductFilter from './hooks/useProductFilter'

// 페이지를 옮기면 맨 위에서 시작
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const App = () => {
  const { filter, isFiltering, search, selectCategory, toggleCategory, showAll, clear } = useProductFilter()

  // 해시 라우터(#/quote)를 쓰기 때문에 href="#main"으로 이동하면 주소가 바뀌어 버림 → 직접 본문에 포커스를 줌
  const handleSkipLink = (event) => {
    event.preventDefault()
    document.getElementById('main')?.focus()
  }

  return (
    <>
      <ScrollToTop />
      {/* 키보드 사용자가 반복되는 메뉴를 건너뛰고 본문으로 바로 가는 링크 (Tab 키를 처음 누르면 나타남) */}
      <Box
        component="a"
        href="#main"
        onClick={handleSkipLink}
        sx={{
          position: 'absolute',
          left: 16,
          top: -100,
          zIndex: 2000,
          px: 2,
          py: 1,
          bgcolor: 'secondary.main',
          color: '#fff',
          borderRadius: 1,
          '&:focus': { top: 16 },
        }}
      >
        본문 바로가기
      </Box>
      <Header query={filter.query} onSearch={search} onSelectCategory={selectCategory} onHome={clear} />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                filter={filter}
                isFiltering={isFiltering}
                onSearch={search}
                onToggleCategory={toggleCategory}
                onShowAll={showAll}
                onClear={clear}
              />
            }
          />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <FloatingMenu />
    </>
  )
}

export default App
