import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import WoodPanel from '../components/common/WoodPanel'
import SectionHeading from '../components/common/SectionHeading'
import mascotLogo from '../assets/logo-mascot-photo.webp'

const Login = () => {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [feedback, setFeedback] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nickname.trim() || !password.trim()) {
      setFeedback({ severity: 'error', message: '닉네임과 비밀번호를 입력해주세요.' })
      return
    }
    setFeedback({ severity: 'success', message: `${nickname}님, 환영해요! 로그인되었습니다.` })
    setTimeout(() => navigate('/mypage'), 1200)
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 6, sm: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src={mascotLogo} alt="" sx={{ width: 72, height: 84, objectFit: 'contain', mb: 1.5 }} />
        <SectionHeading eyebrow="WELCOME BACK" title="로그인" description="빵덕후 레벨업에 오신 걸 환영해요" sx={{ mb: 4 }} />

        <WoodPanel variant="light" sx={{ p: 3, width: '100%' }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              로그인
            </Button>
            <Button component={Link} to="/signup" variant="outlined" size="large" fullWidth>
              회원가입
            </Button>
          </Box>
        </WoodPanel>
      </Box>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={feedback?.severity} variant="filled" onClose={() => setFeedback(null)}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default Login
