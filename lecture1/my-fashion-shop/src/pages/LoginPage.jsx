import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { useAuth } from '../hooks/useAuth'

const KAKAO_YELLOW = '#FEE500'
const NAVER_GREEN = '#03C75A'

const LoginPage = () => {
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail } = useAuth()

  const [showPw, setShowPw] = useState(false)
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return }
    setLoading(true)

    if (tab === 'login') {
      const { error } = await signInWithEmail(email, password)
      if (error) setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      else navigate('/')
    } else {
      if (!name) { setError('닉네임을 입력해주세요.'); setLoading(false); return }
      const { error } = await signUpWithEmail(email, password, name)
      if (error) {
        if (error.message.includes('already')) setError('이미 가입된 이메일입니다.')
        else if (error.message.includes('confirmed')) setError('가입 후 이메일 인증을 완료해주세요.')
        else setError('회원가입 중 오류가 발생했습니다.')
      } else {
        navigate('/')
      }
    }
    setLoading(false)
  }

  return (
    <Box
      sx={{
        bgcolor: '#0B0B0B',
        minHeight: '100svh',
        maxWidth: 430,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        px: 3,
        pt: 6,
        pb: 4,
      }}
    >
      {/* 로고 */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h4"
          sx={{ color: '#39FF14', fontWeight: 900, letterSpacing: '-1px', fontSize: 36 }}
        >
          HYPE FITS
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 3, fontSize: 10 }}>
          FASHION · STYLE · VIBE
        </Typography>
      </Box>

      {/* 탭 */}
      <Box sx={{ display: 'flex', mb: 3, bgcolor: '#141414', borderRadius: 2, p: 0.5 }}>
        {['login', 'signup'].map((t) => (
          <Button
            key={t}
            fullWidth
            onClick={() => { setTab(t); setError('') }}
            sx={{
              borderRadius: 1.5,
              bgcolor: tab === t ? '#39FF14' : 'transparent',
              color: tab === t ? '#0B0B0B' : 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              py: 1,
              '&:hover': { bgcolor: tab === t ? '#2ECC10' : 'rgba(255,255,255,0.05)' },
            }}
          >
            {t === 'login' ? '로그인' : '회원가입'}
          </Button>
        ))}
      </Box>

      {/* SNS 로그인 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Button
          fullWidth
          sx={{
            bgcolor: KAKAO_YELLOW, color: '#3C1E1E', fontWeight: 700,
            py: 1.5, borderRadius: 2, fontSize: 15,
            '&:hover': { bgcolor: '#F0D800' },
          }}
        >
          카카오로 {tab === 'login' ? '로그인' : '시작하기'}
        </Button>
        <Button
          fullWidth
          sx={{
            bgcolor: NAVER_GREEN, color: '#fff', fontWeight: 700,
            py: 1.5, borderRadius: 2, fontSize: 15,
            '&:hover': { bgcolor: '#02B04F' },
          }}
        >
          네이버로 {tab === 'login' ? '로그인' : '시작하기'}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          sx={{
            borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700,
            py: 1.5, borderRadius: 2, fontSize: 15,
            '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Apple로 {tab === 'login' ? '로그인' : '시작하기'}
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
          또는 이메일로 계속
        </Typography>
      </Divider>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255,0,0,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,0,0,0.2)' }}>
          {error}
        </Alert>
      )}

      {/* 이메일 폼 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tab === 'signup' && (
          <TextField
            fullWidth
            placeholder="닉네임"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
            InputProps={{
              sx: {
                bgcolor: '#141414', color: 'white', borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&.Mui-focused fieldset': { borderColor: '#39FF14' },
              },
            }}
          />
        )}
        <TextField
          fullWidth
          placeholder="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          InputProps={{
            sx: {
              bgcolor: '#141414', color: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#39FF14' },
            },
          }}
        />
        <TextField
          fullWidth
          placeholder="비밀번호"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw(!showPw)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPw ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              bgcolor: '#141414', color: 'white', borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#39FF14' },
            },
          }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#39FF14', color: '#0B0B0B', fontWeight: 800,
            py: 1.7, borderRadius: 2, fontSize: 16,
            boxShadow: '0 0 20px rgba(57,255,20,0.3)',
            '&:hover': { bgcolor: '#2ECC10' },
            '&:disabled': { bgcolor: 'rgba(57,255,20,0.3)', color: 'rgba(0,0,0,0.4)' },
          }}
        >
          {loading
            ? <CircularProgress size={22} sx={{ color: '#0B0B0B' }} />
            : tab === 'login' ? '로그인' : '가입하기'
          }
        </Button>
      </Box>

      {tab === 'login' && (
        <Typography
          variant="caption"
          sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', mt: 2, cursor: 'pointer' }}
        >
          비밀번호를 잊으셨나요?
        </Typography>
      )}
    </Box>
  )
}

export default LoginPage
