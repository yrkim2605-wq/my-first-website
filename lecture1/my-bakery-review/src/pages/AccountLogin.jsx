import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import WoodPanel from '../components/common/WoodPanel'
import SectionHeading from '../components/common/SectionHeading'
import EmailVerificationPanel from '../components/auth/EmailVerificationPanel'
import PasswordField from '../components/auth/PasswordField'
import logo from '../assets/logo.webp'
import { useProfile } from '../hooks/useProfile'

// 계정(이메일 + 비밀번호) 로그인 화면. 계정 모드(VITE_DATA_BACKEND=supabase)에서만 쓰여요.
const AccountLogin = () => {
  const navigate = useNavigate()
  const { profile, accountSignIn, backendProblem, authNotice, clearAuthNotice } = useProfile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = Boolean(email.trim() && password) && !submitting && !backendProblem

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    clearAuthNotice()
    try {
      await accountSignIn({ email, password })
      setPassword('') // 입력칸의 비밀번호는 바로 지워요
      navigate('/mypage')
    } catch (caught) {
      setError(caught)
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 6, sm: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src={logo} alt="빵덕후 레벨업" sx={{ width: { xs: 180, sm: 210 }, height: 'auto', mb: 1.5 }} />
        <SectionHeading variant="sign" eyebrow="WELCOME BACK" title="로그인" description="이메일과 비밀번호로 모험을 이어가요" sx={{ mb: 3 }} />

        {backendProblem && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {backendProblem}
          </Alert>
        )}
        {authNotice && (
          <Alert severity={authNotice.severity} onClose={clearAuthNotice} sx={{ mb: 2, width: '100%' }}>
            {authNotice.message}
          </Alert>
        )}

        <WoodPanel variant="light" sx={{ p: 3, width: '100%' }}>
          {profile && (
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
              지금은 <b>{profile.nickname}</b> 모험가로 로그인돼 있어요.
            </Typography>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="이메일"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
              size="small"
              autoComplete="email"
              slotProps={{ htmlInput: { inputMode: 'email', autoCapitalize: 'none' } }}
            />
            <PasswordField label="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />

            {error && error.code === 'EMAIL_NOT_CONFIRMED' ? (
              <EmailVerificationPanel email={email.trim().toLowerCase()} title="이메일 인증이 필요해요" />
            ) : (
              error && <Alert severity="error">{error.message}</Alert>
            )}

            <Button type="submit" variant="contained" size="large" fullWidth disabled={!canSubmit}>
              {submitting ? '로그인 중…' : '로그인'}
            </Button>
            <Button component={Link} to="/signup" variant="outlined" size="large" fullWidth>
              새 모험가 만들기 (회원가입)
            </Button>
          </Box>
        </WoodPanel>
      </Box>
    </Container>
  )
}

export default AccountLogin
