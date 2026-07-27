import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Community from './pages/Community'
import MyPage from './pages/MyPage'
import Ranking from './pages/Ranking'
import BakeryDetail from './pages/BakeryDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/community" element={<Community />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/bakery/:id" element={<BakeryDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
