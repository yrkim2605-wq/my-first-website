import { lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import useMediaQuery from '@mui/material/useMediaQuery'
import Layout from './components/layout/Layout'
import Home from './pages/Home'

// 첫 화면(Home)만 바로 불러오고, 나머지 페이지는 들어갈 때 따로 불러와요.
const Community = lazy(() => import('./pages/Community'))
const CommunityPostDetail = lazy(() => import('./pages/CommunityPostDetail'))
const MyPage = lazy(() => import('./pages/MyPage'))
const Ranking = lazy(() => import('./pages/Ranking'))
const BakeryDetail = lazy(() => import('./pages/BakeryDetail'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
import { BusanBakeriesProvider } from './context/BusanBakeriesContext'
import { VisitedBakeriesProvider } from './context/VisitedBakeriesContext'
import { RealBakeryPhotosProvider } from './context/RealBakeryPhotosContext'

function App() {
  // 움직임 줄이기 설정이면 부드러운 스크롤(Lenis)을 쓰지 않고 브라우저 기본 스크롤을 써요
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <BusanBakeriesProvider>
      <VisitedBakeriesProvider>
        <RealBakeryPhotosProvider>
          <ReactLenis root options={{ lerp: 0.1, duration: 1.4, smoothWheel: !prefersReducedMotion }}>
            <HashRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/:id" element={<CommunityPostDetail />} />
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/ranking" element={<Ranking />} />
                  <Route path="/bakery/:id" element={<BakeryDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                </Route>
              </Routes>
            </HashRouter>
          </ReactLenis>
        </RealBakeryPhotosProvider>
      </VisitedBakeriesProvider>
    </BusanBakeriesProvider>
  )
}

export default App
