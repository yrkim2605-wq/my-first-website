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
// 계정 모드(VITE_DATA_BACKEND=supabase)에서는 이메일 로그인 · 가입 화면을 써요
const AccountLogin = lazy(() => import('./pages/AccountLogin'))
const AccountSignup = lazy(() => import('./pages/AccountSignup'))
import { IS_ACCOUNT_MODE } from './lib/backend'
import { BusanBakeriesProvider } from './context/BusanBakeriesContext'
import { VisitedBakeriesProvider } from './context/VisitedBakeriesContext'
import { RealBakeryPhotosProvider } from './context/RealBakeryPhotosContext'
import { ProfileProvider } from './context/ProfileContext'
import { ReviewsProvider } from './context/ReviewsContext'

function App() {
  // 움직임 줄이기 설정이면 부드러운 스크롤(Lenis)을 쓰지 않고 브라우저 기본 스크롤을 써요
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <BusanBakeriesProvider>
      {/* 프로필 · 방문 체크 · 리뷰 저장소: 로컬 모드는 이 브라우저에만, 계정 모드는 Supabase 계정에 저장해요 */}
      <ProfileProvider>
        <VisitedBakeriesProvider>
          <ReviewsProvider>
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
                      <Route path="/login" element={IS_ACCOUNT_MODE ? <AccountLogin /> : <Login />} />
                      <Route path="/signup" element={IS_ACCOUNT_MODE ? <AccountSignup /> : <Signup />} />
                    </Route>
                  </Routes>
                </HashRouter>
              </ReactLenis>
            </RealBakeryPhotosProvider>
          </ReviewsProvider>
        </VisitedBakeriesProvider>
      </ProfileProvider>
    </BusanBakeriesProvider>
  )
}

export default App
