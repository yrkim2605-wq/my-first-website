import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import PasswordField from '../auth/PasswordField'
import { useProfile } from '../../hooks/useProfile'
import { RADIUS } from '../../theme'

export const DELETE_CONFIRM_TEXT = '탈퇴합니다'

// 마이페이지 맨 아래 "계정 관리". 회원 탈퇴는 되돌릴 수 없어서 ① 무엇이 지워지는지 안내 ② 비밀번호 다시 입력 ③ 확인 문구 입력을 거쳐요.
// 계정 모드에서만 보여요 (로컬 임시 프로필에는 서버 계정이 없어요).
const AccountDangerZone = () => {
  const navigate = useNavigate()
  const { profile, isAccountMode, deleteAccount } = useProfile()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  // 계정이 지워지면 profile이 사라져서 이 영역이 통째로 사라져요. 완료 안내를 보여주려고 지우는 동안에는 계속 그려요.
  const [keepMounted, setKeepMounted] = useState(false)

  if (!isAccountMode || (!profile && !keepMounted)) return null

  const canSubmit = Boolean(password) && confirmText.trim() === DELETE_CONFIRM_TEXT && !submitting

  const handleFinish = () => navigate('/', { replace: true })

  const handleClose = () => {
    if (submitting) return // 지우는 중에는 닫지 않아요
    if (done) return handleFinish()
    setOpen(false)
    setPassword('')
    setConfirmText('')
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    setKeepMounted(true)
    try {
      await deleteAccount({ password })
      setDone(true)
    } catch (caught) {
      setKeepMounted(false)
      setError(caught)
      setPassword('') // 틀렸거나 실패했으면 비밀번호는 다시 입력받아요
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box component="section" aria-label="계정 관리" sx={{ mt: 8, pt: 3, borderTop: '2px dashed rgba(201,165,106,0.7)' }}>
      <Typography component="h2" sx={{ fontWeight: 900, fontSize: '1.05rem', mb: 0.75 }}>
        계정 관리
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1.5, wordBreak: 'keep-all' }}>
        탈퇴하면 내 기록이 모두 삭제되고 되돌릴 수 없어요.
      </Typography>
      <Button color="error" variant="outlined" onClick={() => setOpen(true)} sx={{ minHeight: 44 }}>
        회원 탈퇴
      </Button>

      <Dialog open={open || done} onClose={handleClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: RADIUS.lg } } }}>
        {done ? (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>탈퇴가 완료됐어요</DialogTitle>
            <DialogContent>
              <Typography sx={{ wordBreak: 'keep-all' }}>계정과 기록이 모두 삭제됐어요. 그동안 빵덕후 레벨업과 함께해 주셔서 고마워요.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button variant="contained" onClick={handleFinish} sx={{ minHeight: 44 }}>
                첫 화면으로
              </Button>
            </DialogActions>
          </>
        ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle sx={{ fontWeight: 900 }}>정말 탈퇴할까요?</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="warning" sx={{ wordBreak: 'keep-all' }}>
              <b>{profile.nickname}</b> 계정과 아래 기록이 <b>모두 삭제되고 되돌릴 수 없어요.</b>
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                <li>내가 쓴 모험 일지(리뷰), 레벨 · EXP · 도감</li>
                <li>내가 쓴 커뮤니티 글과 댓글 (내 글에 달린 다른 사람의 댓글도 함께 지워져요)</li>
                <li>내가 남긴 좋아요 · 다녀왔어요 체크</li>
                <li>내가 올린 사진 파일</li>
              </Box>
            </Alert>
            <PasswordField label="비밀번호 확인" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            <TextField
              label={`확인 문구: "${DELETE_CONFIRM_TEXT}" 입력`}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              fullWidth
              size="small"
              autoComplete="off"
            />
            {error && <Alert severity="error">{error.message}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClose} disabled={submitting} sx={{ minHeight: 44 }}>
              취소
            </Button>
            <Button type="submit" color="error" variant="contained" disabled={!canSubmit} sx={{ minHeight: 44 }}>
              {submitting ? '지우는 중…' : '탈퇴하기'}
            </Button>
          </DialogActions>
        </Box>
        )}
      </Dialog>
    </Box>
  )
}

export default AccountDangerZone
