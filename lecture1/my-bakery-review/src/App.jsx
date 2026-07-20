import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Community from './pages/Community'
import MyPage from './pages/MyPage'
import Ranking from './pages/Ranking'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/community" element={<Community />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/ranking" element={<Ranking />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
