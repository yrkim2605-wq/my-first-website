import { HashRouter, Routes, Route } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Community from './pages/Community'
import CommunityPostDetail from './pages/CommunityPostDetail'
import MyPage from './pages/MyPage'
import Ranking from './pages/Ranking'
import BakeryDetail from './pages/BakeryDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { BusanBakeriesProvider } from './context/BusanBakeriesContext'
import { VisitedBakeriesProvider } from './context/VisitedBakeriesContext'
import { RealBakeryPhotosProvider } from './context/RealBakeryPhotosContext'

function App() {
  return (
    <BusanBakeriesProvider>
      <VisitedBakeriesProvider>
        <RealBakeryPhotosProvider>
          <ReactLenis root options={{ lerp: 0.1, duration: 1.4, smoothWheel: true }}>
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
