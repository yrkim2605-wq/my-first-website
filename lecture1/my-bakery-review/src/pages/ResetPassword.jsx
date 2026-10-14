import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AuthPanel from '../components/common/AuthPanel'
import SectionHeading from '../components/common/SectionHeading'
import PasswordField from '../components/auth/PasswordField'
import { useProfile } from '../hooks/useProfile'
import { PASSWORD_MIN } from '../storage/accountRepository'

// 새 비밀번호 정하기: 메일의 재설정 링크로 들어온 경우에만 입력칸을 보여줘요.
// 링크 없이 직접 들어오면 "링크가 만료됐어요" 안내를 보여줘요.
const ResetPassword = () => {
  const navigate = useNavigate()
  const { ready, hasRecoverySession, updatePassword } = useProfile()
  const [status, setStatus] = useState('checking') // checking | allowed | denied
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!ready) return undefined
    let isCancelled = false
    hasRecoverySession().then((allowed) => !isCancelled && setStatus(allowed ? 'allowed' : 'denied'))
    return () => {
      isCancelled = true
    }
  }, [ready, hasRecoverySession])

  const passwordValid = password.length >= PASSWORD_MIN
  const passwordsMatch = password === passwordConfirm
  const canSubmit = passwordValid && passwordsMatch && !submitting

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await updatePassword(password)
      setPassword('')
      setPasswordConfirm('')
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (caught) {
      setError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 5, sm: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SectionHeading variant="sign" eyebrow="NEW PASSWORD" title="새 비밀번호" description="앞으로 쓸 비밀번호를 정해 주세요" sx={{ mb: 3 }} />

        <AuthPanel knight="knight-map" prop="signpost">
          {status === 'checking' && <Alert severity="info">링크를 확인하고 있어요…</Alert>}

          {status === 'denied' && (
            <Box role="alert" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning">재설정 링크가 만료되었거나 이미 사용됐어요. 비밀번호 찾기를 다시 진행해 주세요.</Alert>
              <Button component={Link} to="/forgot-password" variant="contained" size="large" fullWidth>
                비밀번호 찾기 다시 하기
              </Button>
            </Box>
          )}

          {status === 'allowed' && (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <PasswordField
                label="새 비밀번호"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                error={Boolean(password) && !passwordValid}
                helperText={`${PASSWORD_MIN}자 이상`}
              />
              <PasswordField
                label="새 비밀번호 확인"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                autoComplete="new-password"
                error={Boolean(passwordConfirm) && !passwordsMatch}
                helperText={passwordConfirm && !passwordsMatch ? '비밀번호가 서로 달라요.' : ' '}
              />
              {error && <Alert severity="error">{error.message}</Alert>}
              <Button type="submit" variant="contained" size="large" fullWidth disabled={!canSubmit}>
                {submitting ? '저장 중…' : '비밀번호 바꾸기'}
              </Button>
            </Box>
          )}
        </AuthPanel>
      </Box>
    </Container>
  )
}

export default ResetPassword
