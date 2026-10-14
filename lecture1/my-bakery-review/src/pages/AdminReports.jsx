import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import SectionHeading from '../components/common/SectionHeading'
import StatusMessage from '../components/common/StatusMessage'
import { PAGE_TABS_SX } from '../constants/tabStyles'
import { PARCHMENT_SX } from '../constants/rpgStyles'
import { useProfile } from '../hooks/useProfile'
import { reportRepository } from '../storage/reportRepository'
import { REPORT_NOTE_MAX, REPORT_REASONS } from '../storage/supabaseReportRepository'
import { formatPostDate } from '../utils/communityFormat'
import { RADIUS } from '../theme'

const TARGET_LABEL = { post: '글', comment: '댓글', review: '일지(리뷰)' }
const TARGET_ASK = { post: '이 글을', comment: '이 댓글을', review: '이 일지를' }
const STATUS_TABS = [
  { id: 'open', label: '열린 신고' },
  { id: 'resolved', label: '삭제 처리' },
  { id: 'rejected', label: '반려' },
]

// 신고된 내용을 볼 수 있는 곳으로 가는 주소
const targetPath = (report) => {
  if (report.targetType === 'post') return `/community/${report.targetId}`
  if (report.targetType === 'comment') return report.context ? `/community/${report.context}` : null
  return report.context ? `/bakery/${report.context}` : null
}

const ReportCard = ({ report, busy, onHandle }) => {
  const [note, setNote] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const reason = REPORT_REASONS.find((item) => item.id === report.reason)?.label ?? report.reason
  const path = targetPath(report)
  const isOpen = report.status === 'open'

  return (
    <Box component="article" sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip size="small" label={TARGET_LABEL[report.targetType]} sx={{ fontWeight: 800, bgcolor: 'wood.main', color: 'gold.light' }} />
        <Chip size="small" label={reason} sx={{ fontWeight: 800 }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: 'auto' }}>{formatPostDate(report.createdAt)}</Typography>
      </Box>

      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
        작성자: <b>{report.targetAuthor}</b>
      </Typography>
      {/* 신고된 내용 (신고 시점에 저장해 둔 앞부분). 글자 그대로 보여줘요 */}
      <Box sx={{ p: 1.5, borderRadius: RADIUS.md, bgcolor: 'rgba(46,42,37,0.05)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', lineHeight: 1.6 }}>
        {report.snapshot || '(내용 없음)'}
      </Box>
      {report.detail && (
        <Typography sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
          <b>신고자 설명:</b> {report.detail}
        </Typography>
      )}
      {path && (
        <Button component={Link} to={path} size="small" sx={{ alignSelf: 'flex-start', minHeight: 44 }}>
          원문 보러 가기
        </Button>
      )}

      {isOpen ? (
        <>
          <TextField
            label="처리 메모 (선택, 운영자만 봐요)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: REPORT_NOTE_MAX } }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" disabled={busy} onClick={() => onHandle(report, 'dismiss', note)} sx={{ minHeight: 44 }}>
              반려 (문제 없음)
            </Button>
            <Button variant="contained" color="error" disabled={busy} onClick={() => setConfirmRemove(true)} sx={{ minHeight: 44 }}>
              삭제하고 처리
            </Button>
          </Box>
          <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 900 }}>{TARGET_ASK[report.targetType]} 삭제할까요?</DialogTitle>
            <DialogContent>
              <Typography sx={{ wordBreak: 'keep-all' }}>
                삭제하면 되돌릴 수 없어요. 사진이 있으면 파일도 지워요. 같은 내용에 대한 다른 열린 신고도 함께 처리돼요.
                {report.targetType === 'post' && ' 글에 달린 댓글도 함께 삭제돼요.'}
                {report.targetType === 'review' && ' 작성자의 EXP는 다시 계산돼요.'}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setConfirmRemove(false)} sx={{ minHeight: 44 }}>
                취소
              </Button>
              <Button
                color="error"
                variant="contained"
                disabled={busy}
                onClick={() => {
                  setConfirmRemove(false)
                  onHandle(report, 'remove', note)
                }}
                sx={{ minHeight: 44 }}
              >
                삭제하고 처리
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {report.status === 'resolved' ? '삭제 처리' : '반려'} · {report.handledAt ? formatPostDate(report.handledAt) : ''}
          {report.handledNote && ` · 메모: ${report.handledNote}`}
        </Typography>
      )}
    </Box>
  )
}

// 운영자 신고 처리 화면 (/admin/reports). 운영자가 아니면 아무것도 보여주지 않아요 (진짜 권한은 서버가 지켜요).
const AdminReports = () => {
  const { profile, ready } = useProfile()
  const [adminCheck, setAdminCheck] = useState('checking') // 서버에 물어본 결과: checking | allowed | denied
  const [status, setStatus] = useState('open')
  const [list, setList] = useState({ key: null, items: [], errorMessage: null })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { severity, message }
  const [reloadCount, setReloadCount] = useState(0)

  const canAsk = ready && Boolean(profile) && Boolean(reportRepository)
  // 로그인하지 않았으면 서버에 물어볼 필요 없이 거절이에요. 로그인했다면 서버에 운영자인지 물어봐요.
  const access = !ready ? 'checking' : canAsk ? adminCheck : 'denied'

  useEffect(() => {
    if (!canAsk) return undefined
    let isCancelled = false
    reportRepository.isAdmin().then((isAdmin) => !isCancelled && setAdminCheck(isAdmin ? 'allowed' : 'denied'))
    return () => {
      isCancelled = true
    }
  }, [canAsk])

  const requestKey = `${status}|${reloadCount}`
  const load = useCallback(async () => {
    try {
      const items = await reportRepository.listReports({ status })
      return { key: requestKey, items, errorMessage: null }
    } catch (error) {
      return { key: requestKey, items: [], errorMessage: error.message }
    }
  }, [status, requestKey])

  useEffect(() => {
    if (access !== 'allowed') return undefined
    let isCancelled = false
    load().then((result) => !isCancelled && setList(result))
    return () => {
      isCancelled = true
    }
  }, [access, load])

  const handleReport = async (report, action, note) => {
    if (busy) return
    setBusy(true)
    setNotice(null)
    try {
      const result = await reportRepository.handleReport({ reportId: report.id, action, note })
      if (action === 'remove' && result.photoPath && result.photoRemoved === false) {
        setNotice({ severity: 'warning', message: `삭제 처리는 끝났지만 사진 파일은 지우지 못했어요. Supabase → Storage → photos에서 "${result.photoPath}"를 직접 지워 주세요.` })
      } else {
        setNotice({ severity: 'success', message: action === 'remove' ? '삭제하고 처리했어요.' : '반려했어요.' })
      }
    } catch (error) {
      setNotice({ severity: 'error', message: error.message })
    } finally {
      setBusy(false)
      setReloadCount((count) => count + 1)
    }
  }

  if (!ready || access === 'checking') {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: { xs: 5, sm: 8 } }}>
          <StatusMessage mood="loading" title="확인하고 있어요" description="잠시만 기다려 주세요." />
        </Box>
      </Container>
    )
  }

  if (access === 'denied') {
    // 운영자 화면이 있다는 것도 드러내지 않도록, 없는 페이지처럼 보여줘요
    return (
      <Container maxWidth="md">
        <Box sx={{ py: { xs: 5, sm: 8 } }}>
          <StatusMessage mood="notfound" title="페이지를 찾을 수 없어요" description="주소가 잘못됐거나 없어진 페이지예요." actionLabel="첫 화면으로" onAction={() => (window.location.hash = '#/')} />
        </Box>
      </Container>
    )
  }

  const isLoading = list.key !== requestKey

  return (
    <Container maxWidth="md">
      <Box sx={{ pt: { xs: 3, sm: 4.5 }, pb: { xs: 6, sm: 8 } }}>
        <SectionHeading variant="sign" eyebrow="ADMIN" title="신고 처리" description="운영자만 볼 수 있는 화면이에요." sx={{ mb: { xs: 2, sm: 3 } }} />

        {notice && (
          <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2, wordBreak: 'keep-all' }}>
            {notice.message}
          </Alert>
        )}

        <Tabs value={status} onChange={(_, value) => setStatus(value)} variant="scrollable" scrollButtons={false} sx={{ ...PAGE_TABS_SX, mb: 2 }}>
          {STATUS_TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} disableRipple />
          ))}
        </Tabs>

        {isLoading ? (
          <StatusMessage mood="loading" title="신고를 불러오고 있어요" description="잠시만 기다려 주세요." />
        ) : list.errorMessage ? (
          <StatusMessage mood="error" title="신고를 불러오지 못했어요" description={list.errorMessage} actionLabel="다시 시도" onAction={() => setReloadCount((count) => count + 1)} />
        ) : list.items.length === 0 ? (
          <StatusMessage mood="empty" title={status === 'open' ? '처리할 신고가 없어요' : '아직 없어요'} description={status === 'open' ? '모두 처리했어요. 수고하셨어요!' : undefined} />
        ) : (
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {list.items.map((report) => (
              <li key={report.id}>
                <ReportCard report={report} busy={busy} onHandle={handleReport} />
              </li>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default AdminReports
