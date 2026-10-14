import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AuthPanel from '../components/common/AuthPanel'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import logo from '../assets/logo.webp'
import { useProfile } from '../hooks/useProfile'
import { NICKNAME_MAX, NICKNAME_MIN } from '../storage/profileRepository'

// 새 임시 로컬 프로필 만들기. (진짜 회원가입이 아니에요: 서버에 가입되지 않고, 이 브라우저에만 저장돼요.)
const Signup = () => {
  const navigate = useNavigate()
  const { signUp } = useProfile()
  const [nickname, setNickname] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      // 저장에 성공했을 때만 완료 메시지를 보여줘요
      const created = await signUp(nickname)
      setFeedback({ severity: 'success', message: `${created.nickname} 모험가가 만들어졌어요! 모험을 시작해요.` })
      setTimeout(() => navigate('/mypage'), 900)
    } catch (error) {
      setFeedback({ severity: 'error', message: error.message })
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 6, sm: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src={logo} alt="빵덕후 레벨업" sx={{ width: { xs: 180, sm: 210 }, height: 'auto', mb: 1.5 }} />
        <SectionHeading
          variant="sign"
          eyebrow="JOIN US"
          title="회원가입"
          description="닉네임을 정하고 나만의 모험가를 만들어요"
          sx={{ mb: 3 }}
        />

        <LocalProfileNotice sx={{ mb: 2, width: '100%' }} />

        <AuthPanel knight="knight-hooray" prop="flag">
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="닉네임"
              helperText={`${NICKNAME_MIN}~${NICKNAME_MAX}자`}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              fullWidth
              size="small"
              autoComplete="off"
              slotProps={{ htmlInput: { maxLength: NICKNAME_MAX } }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting || !nickname.trim()}>
              모험가 만들기
            </Button>
            <Button component={Link} to="/login" variant="outlined" size="large" fullWidth>
              이미 만들었어요 (로그인)
            </Button>
          </Box>
        </AuthPanel>
      </Box>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2500}
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
