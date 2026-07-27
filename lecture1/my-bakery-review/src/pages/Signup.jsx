import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import WoodPanel from '../components/common/WoodPanel'
import mascotLogo from '../assets/logo-mascot-photo.png'

const Signup = () => {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [feedback, setFeedback] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nickname.trim() || !password.trim()) {
      setFeedback({ severity: 'error', message: '닉네임과 비밀번호를 입력해주세요.' })
      return
    }
    if (password !== passwordConfirm) {
      setFeedback({ severity: 'error', message: '비밀번호가 일치하지 않아요.' })
      return
    }
    setFeedback({ severity: 'success', message: '회원가입이 완료됐어요! 로그인 페이지로 이동할게요.' })
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 6, sm: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src={mascotLogo} alt="" sx={{ width: 64, height: 76, objectFit: 'contain', mb: 2 }} />
        <Typography variant="h1" sx={{ fontSize: '1.6rem', mb: 0.5 }}>
          회원가입
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          닉네임을 만들고 빵덕후 레벨업을 시작해보세요
        </Typography>

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
            <TextField
              label="비밀번호 확인"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              fullWidth
              size="small"
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              회원가입
            </Button>
          </Box>
        </WoodPanel>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          이미 계정이 있으신가요?{' '}
          <Box component={Link} to="/login" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}>
            로그인
          </Box>
        </Typography>
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

export default Signup
