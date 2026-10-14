import { useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import AuthPanel from '../components/common/AuthPanel'
import SectionHeading from '../components/common/SectionHeading'
import { useProfile } from '../hooks/useProfile'

// 비밀번호 찾기: 이메일을 받아 재설정 메일을 보내요.
// 가입된 이메일인지는 알려주지 않아요 (없는 이메일이어도 같은 안내가 나와요).
const ForgotPassword = () => {
  const { requestPasswordReset, backendProblem } = useProfile()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState(null)

  const canSubmit = Boolean(email.trim()) && !submitting && !backendProblem

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setSentTo(email.trim().toLowerCase())
    } catch (caught) {
      setError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 5, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SectionHeading variant="sign" eyebrow="FORGOT PASSWORD" title="비밀번호 찾기" description="가입한 이메일로 재설정 링크를 보내 드려요" sx={{ mb: 3 }} />

        {backendProblem && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {backendProblem}
          </Alert>
        )}

        <AuthPanel knight="knight-search" prop="signpost">
          {sentTo ? (
            <Box role="status" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="success">
                <b>{sentTo}</b>이(가) 가입된 이메일이라면 재설정 메일을 보냈어요. 메일의 링크를 눌러 새 비밀번호를 정해 주세요.
              </Alert>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
                메일이 안 보이면 스팸함도 확인해 주세요. 링크는 1시간 동안만 쓸 수 있고, <b>메일을 요청한 이 브라우저</b>에서 열어야 해요.
              </Typography>
              <Button component={Link} to="/login" variant="outlined" size="large" fullWidth>
                로그인으로 돌아가기
              </Button>
            </Box>
          ) : (
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
              {error && <Alert severity="error">{error.message}</Alert>}
              <Button type="submit" variant="contained" size="large" fullWidth disabled={!canSubmit}>
                {submitting ? '보내는 중…' : '재설정 메일 보내기'}
              </Button>
              <Button component={Link} to="/login" size="small" sx={{ alignSelf: 'center', minHeight: 44 }}>
                로그인으로 돌아가기
              </Button>
            </Box>
          )}
        </AuthPanel>
      </Box>
    </Container>
  )
}

export default ForgotPassword
