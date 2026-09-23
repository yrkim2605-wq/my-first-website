import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [tab, setTab] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={location.state?.from ?? '/posts'} replace />
  }

  const handleTabChange = (_e, value) => {
    setTab(value)
    setError('')
    setInfo('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await signIn(email, password)
    setSubmitting(false)
    if (signInError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    navigate('/posts')
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signUpError } = await signUp(email, password, name)
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setInfo('회원가입이 완료되었습니다. 로그인해주세요.')
    setTab(0)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 5 }}>
          <Typography variant="h5" align="center" sx={{ mb: 1 }}>
            🍞 빵순이 리뷰
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            빵 맛집 리뷰 커뮤니티
          </Typography>

          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
            <Tab label="로그인" />
            <Tab label="회원가입" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {info && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {info}
            </Alert>
          )}

          {tab === 0 ? (
            <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                로그인
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSignUp} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="이메일"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                helperText="6자 이상 입력해주세요"
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                회원가입
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
