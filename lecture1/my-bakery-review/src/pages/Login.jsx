import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import AuthPanel from '../components/common/AuthPanel'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import logo from '../assets/logo.webp'
import { useProfile } from '../hooks/useProfile'
import { profileRepository, NICKNAME_MAX } from '../storage/profileRepository'

// 임시 로컬 프로필로 이어서 시작하기. (진짜 로그인이 아니에요: 비밀번호 없이, 이 브라우저에 만든 프로필만 고를 수 있어요.)
const Login = () => {
  const navigate = useNavigate()
  const { profile, signIn, signUp } = useProfile()
  const [nickname, setNickname] = useState('')
  const [savedProfiles, setSavedProfiles] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  // 이 브라우저에 없는 닉네임으로 로그인하려 했을 때: 그 닉네임으로 바로 새 모험가를 만들 수 있게 안내를 남겨 둬요 (잠깐 떴다 사라지는 알림만으로는 놓치기 쉬워요)
  const [missingNickname, setMissingNickname] = useState(null)

  useEffect(() => {
    profileRepository.list().then(setSavedProfiles)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      // 성공했을 때만 환영 메시지를 보여줘요
      const signedIn = await signIn(nickname)
      setFeedback({ severity: 'success', message: `${signedIn.nickname} 모험가님, 다시 오셨네요!` })
      setTimeout(() => navigate('/mypage'), 900)
    } catch (error) {
      if (error.code === 'PROFILE_NOT_FOUND') setMissingNickname(nickname.trim())
      else setFeedback({ severity: 'error', message: error.message })
      setSubmitting(false)
    }
  }

  // 안내의 [이 닉네임으로 새 모험가 만들기]: 입력한 닉네임 그대로 새 프로필을 만들고 시작해요
  const handleCreateMissing = async () => {
    if (submitting || !missingNickname) return
    setSubmitting(true)
    try {
      const created = await signUp(missingNickname)
      setMissingNickname(null)
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
          eyebrow="WELCOME BACK"
          title="로그인"
          description="이 브라우저에 만든 모험가로 이어서 시작해요"
          sx={{ mb: 3 }}
        />

        <LocalProfileNotice sx={{ mb: 2, width: '100%' }} />

        <AuthPanel knight="knight-map" prop="signpost">
          {profile && (
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
              지금은 <b>{profile.nickname}</b> 모험가로 사용 중이에요.
            </Typography>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="닉네임"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value)
                setMissingNickname(null)
              }}
              fullWidth
              size="small"
              autoComplete="off"
              slotProps={{ htmlInput: { maxLength: NICKNAME_MAX } }}
            />
            {missingNickname && (
              <Alert
                severity="info"
                role="status"
                sx={{ alignItems: 'center', '& .MuiAlert-message': { width: '100%' } }}
              >
                <Typography sx={{ fontSize: '0.9rem', mb: 1, wordBreak: 'keep-all' }}>
                  이 브라우저에는 <b>{missingNickname}</b> 모험가가 없어요. 이 데모는 비밀번호 없이 이 브라우저에만 저장돼요.
                </Typography>
                <Button onClick={handleCreateMissing} variant="contained" size="small" disabled={submitting} sx={{ minHeight: 44, wordBreak: 'keep-all' }}>
                  ‘{missingNickname}’(으)로 새 모험가 만들기
                </Button>
              </Alert>
            )}
            {savedProfiles.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>이 브라우저의 모험가</Typography>
                {savedProfiles.map((saved) => (
                  <Chip key={saved.userId} label={saved.nickname} size="small" onClick={() => setNickname(saved.nickname)} />
                ))}
              </Box>
            )}
            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting || !nickname.trim()}>
              로그인
            </Button>
            <Button component={Link} to="/signup" variant="outlined" size="large" fullWidth>
              새 모험가 만들기
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

export default Login
