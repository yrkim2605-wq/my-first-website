import { useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import AuthPanel from '../components/common/AuthPanel'
import SectionHeading from '../components/common/SectionHeading'
import EmailVerificationPanel from '../components/auth/EmailVerificationPanel'
import PasswordField from '../components/auth/PasswordField'
import logo from '../assets/logo.webp'
import { useProfile } from '../hooks/useProfile'
import { NICKNAME_PATTERN, NICKNAME_RULE_TEXT, PASSWORD_MIN } from '../storage/accountRepository'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 계정(이메일 + 비밀번호 + 닉네임) 회원가입 화면. 계정 모드에서만 쓰여요.
// 가입하면 인증 메일이 가고, 인증을 마쳐야 로그인할 수 있어요.
const AccountSignup = () => {
  const { accountSignUp, isNicknameAvailable, backendProblem } = useProfile()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nicknameCheck, setNicknameCheck] = useState(null) // null | 'checking' | 'ok' | 'taken' | 'invalid' | 'error'
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState(null)

  const emailValid = EMAIL_PATTERN.test(email.trim())
  const nicknameValid = NICKNAME_PATTERN.test(nickname.trim())
  const passwordValid = password.length >= PASSWORD_MIN
  const passwordsMatch = password === passwordConfirm
  const canSubmit = emailValid && nicknameValid && passwordValid && passwordsMatch && nicknameCheck !== 'taken' && !submitting && !backendProblem

  // 닉네임 입력칸을 벗어나면 서버에 중복을 미리 물어봐요 (가입할 때 한 번 더 확인해요)
  const checkNickname = async () => {
    const clean = nickname.trim()
    if (!clean) return setNicknameCheck(null)
    if (!NICKNAME_PATTERN.test(clean)) return setNicknameCheck('invalid')
    setNicknameCheck('checking')
    try {
      setNicknameCheck((await isNicknameAvailable(clean)) ? 'ok' : 'taken')
    } catch {
      setNicknameCheck('error')
    }
  }

  const nicknameHelp = {
    checking: '확인하는 중…',
    ok: '사용할 수 있는 닉네임이에요.',
    taken: '이미 사용 중인 닉네임이에요.',
    invalid: NICKNAME_RULE_TEXT,
    error: '지금은 중복 확인을 못 했어요. 가입할 때 다시 확인해요.',
  }[nicknameCheck] ?? NICKNAME_RULE_TEXT

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await accountSignUp({ email, password, nickname })
      setSentTo(result.email)
    } catch (caught) {
      setError(caught)
      if (caught.code === 'NICKNAME_TAKEN') setNicknameCheck('taken')
    } finally {
      setPassword('')
      setPasswordConfirm('')
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: { xs: 6, sm: 10 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src={logo} alt="빵덕후 레벨업" sx={{ width: { xs: 180, sm: 210 }, height: 'auto', mb: 1.5 }} />
        <SectionHeading variant="sign" eyebrow="JOIN US" title="회원가입" description="이메일 인증을 마치면 모험을 시작할 수 있어요" sx={{ mb: 3 }} />

        {backendProblem && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {backendProblem}
          </Alert>
        )}

        <AuthPanel knight="knight-hooray" prop="flag">
          {sentTo ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <EmailVerificationPanel email={sentTo} />
              <Button component={Link} to="/login" variant="contained" size="large" fullWidth>
                인증 후 로그인하러 가기
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="이메일"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={Boolean(email) && !emailValid}
                helperText={email && !emailValid ? '이메일 주소를 정확히 입력해 주세요.' : '인증 메일을 받을 주소예요. 다른 사람에게 공개되지 않아요.'}
                fullWidth
                size="small"
                autoComplete="email"
                slotProps={{ htmlInput: { inputMode: 'email', autoCapitalize: 'none' } }}
              />
              <TextField
                label="닉네임"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value)
                  setNicknameCheck(null)
                }}
                onBlur={checkNickname}
                error={nicknameCheck === 'taken' || nicknameCheck === 'invalid' || (Boolean(nickname) && !nicknameValid)}
                helperText={nicknameHelp}
                fullWidth
                size="small"
                autoComplete="nickname"
                slotProps={{ htmlInput: { maxLength: 12 } }}
              />
              <PasswordField
                label="비밀번호"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={Boolean(password) && !passwordValid}
                helperText={`${PASSWORD_MIN}자 이상. 이 앱은 비밀번호를 저장하지 않고, 인증 서버가 암호화해서 보관해요.`}
                autoComplete="new-password"
              />
              <PasswordField
                label="비밀번호 확인"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                error={Boolean(passwordConfirm) && !passwordsMatch}
                helperText={passwordConfirm && !passwordsMatch ? '비밀번호가 서로 달라요.' : ' '}
                autoComplete="new-password"
              />

              {error && <Alert severity="error">{error.message}</Alert>}

              <Button type="submit" variant="contained" size="large" fullWidth disabled={!canSubmit}>
                {submitting ? '가입하는 중…' : '인증 메일 받고 가입하기'}
              </Button>
              <Button component={Link} to="/login" variant="outlined" size="large" fullWidth>
                이미 계정이 있어요 (로그인)
              </Button>
            </Box>
          )}
        </AuthPanel>
      </Box>
    </Container>
  )
}

export default AccountSignup
