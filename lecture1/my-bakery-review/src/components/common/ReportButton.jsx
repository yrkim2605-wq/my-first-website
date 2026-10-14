import { useState } from 'react'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag'
import { useProfile } from '../../hooks/useProfile'
import { reportRepository } from '../../storage/reportRepository'
import { REPORT_DETAIL_MAX, REPORT_REASONS } from '../../storage/supabaseReportRepository'
import { RADIUS } from '../../theme'

const TARGET_LABEL = { post: '글', comment: '댓글', review: '일지' }
const TARGET_ASK = { post: '이 글을', comment: '이 댓글을', review: '이 일지를' } // 조사까지 맞춘 제목

// "신고" 버튼 + 신고 창. 글 · 댓글 · 리뷰(일지) 옆에 붙여서 써요.
//  - 계정 모드에서 로그인한 사람에게만 보여요. (내 글인지는 쓰는 쪽에서 판단해서 안 그려요 — 서버도 내 글 신고는 거절해요)
//  - 신고하면 운영자만 내용을 볼 수 있고, 작성자에게는 알려지지 않아요.
const ReportButton = ({ targetType, targetId, sx }) => {
  const { profile, isAccountMode } = useProfile()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  if (!isAccountMode || !profile || !reportRepository) return null

  const label = TARGET_LABEL[targetType] ?? '글'

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
    // 다음에 열 때 이전 입력이 남지 않게
    setReason('')
    setDetail('')
    setError(null)
    setDone(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reason || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await reportRepository.createReport({ targetType, targetId, reason, detail })
      setDone(true)
    } catch (caught) {
      setError(caught)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)} startIcon={<OutlinedFlagIcon fontSize="small" />} aria-label={`이 ${label} 신고하기`} sx={{ minHeight: 44, color: 'text.secondary', ...sx }}>
        신고
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: RADIUS.lg } } }}>
        {done ? (
          <>
            <DialogTitle sx={{ fontWeight: 900 }}>신고가 접수됐어요</DialogTitle>
            <DialogContent>
              <Typography sx={{ wordBreak: 'keep-all' }}>알려 주셔서 고마워요. 운영자가 확인한 뒤 필요하면 조치할게요. 신고한 사람은 작성자에게 알려지지 않아요.</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button variant="contained" onClick={handleClose} sx={{ minHeight: 44 }}>
                확인
              </Button>
            </DialogActions>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <DialogTitle sx={{ fontWeight: 900 }}>{TARGET_ASK[targetType] ?? '이 글을'} 신고할까요?</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
                운영자만 신고 내용을 볼 수 있어요. 허위 신고나 반복 신고는 제한될 수 있어요.
              </Typography>
              <FormControl>
                <FormLabel id="report-reason-label" sx={{ fontWeight: 700, mb: 0.5 }}>
                  신고 사유
                </FormLabel>
                <RadioGroup aria-labelledby="report-reason-label" value={reason} onChange={(event) => setReason(event.target.value)}>
                  {REPORT_REASONS.map((item) => (
                    <FormControlLabel key={item.id} value={item.id} control={<Radio />} label={item.label} sx={{ minHeight: 44 }} />
                  ))}
                </RadioGroup>
              </FormControl>
              <TextField
                label="자세한 내용 (선택)"
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                multiline
                minRows={2}
                maxRows={5}
                fullWidth
                size="small"
                slotProps={{ htmlInput: { maxLength: REPORT_DETAIL_MAX } }}
                helperText={`${detail.length}/${REPORT_DETAIL_MAX}`}
              />
              {error && <Alert severity="error">{error.message}</Alert>}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button onClick={handleClose} disabled={submitting} sx={{ minHeight: 44 }}>
                취소
              </Button>
              <Button type="submit" variant="contained" disabled={!reason || submitting} sx={{ minHeight: 44 }}>
                {submitting ? '보내는 중…' : '신고하기'}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </>
  )
}

export default ReportButton
