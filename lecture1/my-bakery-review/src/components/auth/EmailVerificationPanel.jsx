import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { useProfile } from '../../hooks/useProfile'
import { RADIUS } from '../../theme'

const RESEND_COOLDOWN_SECONDS = 60

// "인증 메일을 보냈어요" 안내 + 다시 보내기. 가입 직후와, 인증 전에 로그인했을 때 보여줘요.
// 다시 보내기는 60초에 한 번만 눌러져요 (메일 발송 한도를 아끼려고).
const EmailVerificationPanel = ({ email, title = '인증 메일을 보냈어요', sx }) => {
  const { resendVerification } = useProfile()
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (sending || cooldown > 0) return
    setSending(true)
    setResult(null)
    try {
      await resendVerification(email)
      setResult({ severity: 'success', message: '인증 메일을 다시 보냈어요. 메일함과 스팸함을 확인해 주세요.' })
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setResult({ severity: 'error', message: error.message })
      if (error.code === 'EMAIL_RATE_LIMIT' || error.code === 'REQUEST_RATE_LIMIT') setCooldown(RESEND_COOLDOWN_SECONDS)
    } finally {
      setSending(false)
    }
  }

  return (
    <Box role="status" sx={{ textAlign: 'center', p: 2, borderRadius: RADIUS.md, bgcolor: 'rgba(143,166,126,0.18)', border: '1px dashed', borderColor: 'secondary.dark', ...sx }}>
      <MarkEmailReadOutlinedIcon sx={{ fontSize: '2.2rem', color: 'secondary.dark' }} />
      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: '0.9rem', wordBreak: 'break-all', mb: 1 }}>
        <b>{email}</b>
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', wordBreak: 'keep-all', mb: 1.5 }}>
        메일 안의 <b>인증 링크</b>를 누르면 가입이 완료돼요. 인증을 마쳐야 로그인하고 리뷰와 커뮤니티를 이용할 수 있어요. 메일이 안 보이면 스팸함도 확인해 주세요.
      </Typography>
      <Button variant="outlined" size="small" onClick={handleResend} disabled={sending || cooldown > 0}>
        {cooldown > 0 ? `인증 메일 다시 받기 (${cooldown}초 뒤)` : sending ? '보내는 중…' : '인증 메일 다시 받기'}
      </Button>
      {result && (
        <Alert severity={result.severity} sx={{ mt: 1.5, textAlign: 'left' }}>
          {result.message}
        </Alert>
      )}
    </Box>
  )
}

export default EmailVerificationPanel
