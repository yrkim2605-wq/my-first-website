import { lazy } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import useMediaQuery from '@mui/material/useMediaQuery'
import Layout from './components/layout/Layout'
import Home from './pages/Home'

// 첫 화면(Home)만 바로 불러오고, 나머지 페이지는 들어갈 때 따로 불러와요.
const Community = lazy(() => import('./pages/Community'))
const CommunityPostDetail = lazy(() => import('./pages/CommunityPostDetail'))
// 계정 모드에서는 서버에 저장된 실제 글을 보여주는 화면과 글쓰기 · 글 고치기 화면을 써요
const AccountPostDetail = lazy(() => import('./pages/AccountPostDetail'))
const CommunityPostForm = lazy(() => import('./pages/CommunityPostForm'))
const MyPage = lazy(() => import('./pages/MyPage'))
const Ranking = lazy(() => import('./pages/Ranking'))
const BakeryDetail = lazy(() => import('./pages/BakeryDetail'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
// 계정 모드(VITE_DATA_BACKEND=supabase)에서는 이메일 로그인 · 가입 화면을 써요
const AccountLogin = lazy(() => import('./pages/AccountLogin'))
const AccountSignup = lazy(() => import('./pages/AccountSignup'))
const PrivacyPolicyPage = lazy(() => import('./pages/LegalDocument').then((m) => ({ default: m.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('./pages/LegalDocument').then((m) => ({ default: m.TermsOfServicePage })))
const AdminReports = lazy(() => import('./pages/AdminReports'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
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
                      {IS_ACCOUNT_MODE ? (
                        <>
                          <Route path="/community/write" element={<CommunityPostForm />} />
                          <Route path="/community/:id/edit" element={<CommunityPostForm />} />
                          <Route path="/community/:id" element={<AccountPostDetail />} />
                        </>
                      ) : (
                        <>
                          {/* 로컬 모드에는 글쓰기가 없어요 (예시 글만 보여줘요) */}
                          <Route path="/community/write" element={<Navigate to="/community" replace />} />
                          <Route path="/community/:id" element={<CommunityPostDetail />} />
                        </>
                      )}
                      <Route path="/mypage" element={<MyPage />} />
                      <Route path="/ranking" element={<Ranking />} />
                      <Route path="/bakery/:id" element={<BakeryDetail />} />
                      <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms" element={<TermsOfServicePage />} />
                      <Route path="/login" element={IS_ACCOUNT_MODE ? <AccountLogin /> : <Login />} />
                      <Route path="/signup" element={IS_ACCOUNT_MODE ? <AccountSignup /> : <Signup />} />
                      {IS_ACCOUNT_MODE && <Route path="/admin/reports" element={<AdminReports />} />}
                      {IS_ACCOUNT_MODE && <Route path="/forgot-password" element={<ForgotPassword />} />}
                      {IS_ACCOUNT_MODE && <Route path="/reset-password" element={<ResetPassword />} />}
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
