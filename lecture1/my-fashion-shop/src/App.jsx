import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import PostListPage from './pages/PostListPage'
import PostDetailPage from './pages/PostDetailPage'
import PostCreatePage from './pages/PostCreatePage'
import MyPage from './pages/MyPage'
import ReviewPage from './pages/ReviewPage'
import { useAuth } from './hooks/useAuth'

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', bgcolor: '#0B0B0B' }}>
        <CircularProgress sx={{ color: '#39FF14' }} />
      </Box>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="posts" element={<PostListPage />} />
          <Route path="posts/:id" element={<PostDetailPage />} />
          <Route path="create" element={<PostCreatePage />} />
          <Route path="my" element={<MyPage />} />
          <Route path="reviews" element={<ReviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
