import { useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { ImportPreview, ImportProgress, ImportResult } from './LocalImportPreview'
import { useProfile } from '../../hooks/useProfile'
import { useReviews } from '../../hooks/useReviews'
import { useVisitedBakeries } from '../../hooks/useVisitedBakeries'
import { useBusanBakeries } from '../../hooks/useBusanBakeries'
import { IS_ACCOUNT_MODE } from '../../lib/backend'
import { buildImportPlan, loadImportState, readLocalSnapshot, runImport, simulateImportExp, summarizeResults, toImportItems } from '../../migration/localImport'
import { createImportDeps, loadAccountSnapshot } from '../../migration/importService'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 이 브라우저(localStorage)에 있던 기록을 내 계정으로 가져오는 카드예요. 계정 모드 + 로그인 + 가져올 기록이 남아 있을 때만 보여요.
// 흐름: 카드 → [확인 화면(미리보기, 읽기만 해요)] → [최종 확인] → 하나씩 저장 → 결과
//  · 최종 확인 버튼을 누르기 전에는 서버에 아무것도 저장하지 않아요.
//  · 이 브라우저의 원본 기록은 지우지 않아요. 계정별 "이전 상태"만 따로 남겨서, 멈췄다 이어서 해도 중복되지 않아요.

const LocalImportCard = () => {
  const { profile } = useProfile()
  const { reload: reloadReviews, gameSettings } = useReviews()
  const { reload: reloadVisits } = useVisitedBakeries()
  const { bakeries, loading: bakeriesLoading } = useBusanBakeries()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const userId = profile?.userId ?? null

  const [stateVersion, setStateVersion] = useState(0)
  const [step, setStep] = useState('closed') // closed | loading | preview | confirm | running | result | error
  const [account, setAccount] = useState(null)
  const [edits, setEdits] = useState({})
  const [deselected, setDeselected] = useState(() => new Set())
  const [errorMessage, setErrorMessage] = useState(null)
  const [progress, setProgress] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const stopRef = useRef(false)

  // 이 브라우저에 남은 기록 (읽기만 해요). 이전 완료 표시는 "이 계정" 기준이에요.
  const snapshot = useMemo(() => (IS_ACCOUNT_MODE && userId ? readLocalSnapshot() : null), [userId, stateVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const importState = useMemo(() => (userId ? loadImportState(userId) : null), [userId, stateVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const bakeryInfoById = useMemo(() => new Map(bakeries.map((bakery) => [String(bakery.id), bakery])), [bakeries])

  const plan = useMemo(
    () =>
      account && snapshot && importState
        ? buildImportPlan({
            snapshot,
            account: { reviewBakeryIds: account.reviewBakeryIds, visitBakeryIds: account.visitBakeryIds },
            registeredIds: account.registeredIds,
            bakeryInfoById,
            state: importState,
            edits,
          })
        : null,
    [account, snapshot, importState, bakeryInfoById, edits],
  )
  const selectedKeys = useMemo(
    () => (plan ? [...plan.reviews, ...plan.visits].filter((item) => item.status === 'importable' && !deselected.has(item.key)).map((item) => item.key) : []),
    [plan, deselected],
  )
  const items = useMemo(() => (plan ? toImportItems(plan, selectedKeys, bakeryInfoById) : []), [plan, selectedKeys, bakeryInfoById])
  const simulation = useMemo(
    () => (plan && account ? simulateImportExp({ accountReviews: account.accountReviews, items, settings: gameSettings ?? undefined }) : null),
    [plan, account, items, gameSettings],
  )

  if (!IS_ACCOUNT_MODE || !userId || !snapshot || !importState) return null

  // 아직 이전하지 않은 기록 개수 (이전 완료로 표시된 것은 빼요)
  const pendingReviews = snapshot.reviews.filter((review) => !importState.items[`review:${review.id}`]).length
  const pendingVisits = snapshot.visitedIds.filter((id) => !importState.items[`visit:${id}`]).length
  if (pendingReviews + pendingVisits === 0 && step === 'closed') return null

  const reviewCount = items.filter((item) => item.kind === 'review').length
  const visitCount = items.filter((item) => item.kind === 'visit').length
  const isBusy = step === 'running'

  const openPreview = async () => {
    const isContinuing = step === 'result' // 결과 화면에서 "이어서 가져오기"를 누른 경우에는 고쳐 쓴 내용 · 선택을 그대로 둬요
    setStep('loading')
    setErrorMessage(null)
    if (!isContinuing) {
      setEdits({})
      setDeselected(new Set())
    }
    setOutcome(null)
    try {
      const bakeryIds = [...snapshot.reviews.map((review) => String(review.bakeryId)), ...snapshot.visitedIds]
      setAccount(await loadAccountSnapshot(userId, bakeryIds)) // 읽기만 해요
      setStep('preview')
    } catch (error) {
      setErrorMessage(error.message)
      setStep('error')
    }
  }

  const close = () => {
    if (isBusy) return
    setStep('closed')
  }

  const toggle = (key) =>
    setDeselected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const start = async () => {
    stopRef.current = false
    setProgress({ index: 0, total: items.length, item: items[0] })
    setStep('running')
    try {
      const result = await runImport({
        items,
        confirmed: true, // 사용자가 "가져오기 시작"을 눌러 최종 확인한 경우에만 여기까지 와요
        deps: createImportDeps(userId),
        onProgress: (p) => setProgress(p),
        shouldStop: () => stopRef.current,
      })
      setOutcome({ ...result, summary: summarizeResults(result.results) })
    } catch (error) {
      setOutcome({ results: [], stopped: { reason: 'error', message: error.message }, summary: summarizeResults([]) })
    }
    setStateVersion((version) => version + 1)
    await Promise.all([reloadReviews?.(), reloadVisits?.()]).catch(() => {}) // 가져온 기록이 화면(EXP · 레벨 · 도감)에 바로 반영돼요
    setStep('result')
  }

  const hasLeftover = outcome && (outcome.summary.failed > 0 || outcome.summary.notAttempted > 0)

  return (
    <>
      {step === 'closed' && (
        <Box component="section" aria-label="이 브라우저의 기록 가져오기" sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: { xs: 2, sm: 2.5 }, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
            <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, color: 'primary.main' }}>이 브라우저에 있던 기록을 가져올까요?</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25, wordBreak: 'keep-all' }}>
              예전에 이 브라우저에 저장한 모험 일지 <b>{pendingReviews}</b>개 · 다녀왔어요 체크 <b>{pendingVisits}</b>곳이 남아 있어요. 버튼을 눌러도 확인 화면만 열려요. 최종 확인 전에는 서버에 아무것도 저장하지 않고, 이 브라우저의 기록은 지우지 않아요.
            </Typography>
          </Box>
          <Button variant="contained" onClick={openPreview}>
            가져올 기록 확인하기
          </Button>
        </Box>
      )}

      <Dialog open={step !== 'closed'} onClose={close} fullScreen={fullScreen} fullWidth maxWidth="md" scroll="paper" aria-labelledby="local-import-title"
        slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: fullScreen ? 0 : '22px' } } }}>
        <DialogTitle id="local-import-title" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, color: 'primary.main' }}>
          {step === 'confirm' ? '정말 가져올까요?' : step === 'running' ? '기록을 가져오는 중' : step === 'result' ? '가져오기 결과' : '이 브라우저의 기록 가져오기'}
        </DialogTitle>
        <DialogContent dividers>
          {step === 'loading' && <Typography role="status">내 계정의 기록을 확인하고 있어요… (읽기만 해요)</Typography>}
          {step === 'error' && (
            <Alert severity="error">
              {errorMessage || '기록을 확인하지 못했어요.'}
              {!errorMessage?.includes('아무것도 저장되지 않았어요') && ' (아무것도 저장되지 않았어요)'}
            </Alert>
          )}
          {step === 'preview' && plan && (
            <>
              {bakeriesLoading && (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  지도의 빵집 정보를 불러오는 중이에요. 다 불러온 뒤에 가져올 수 있어요.
                </Alert>
              )}
              <ImportPreview plan={plan} selectedKeys={selectedKeys} onToggle={toggle} onEdit={(localId, text) => setEdits((prev) => ({ ...prev, [localId]: text }))} simulation={simulation} />
            </>
          )}
          {step === 'confirm' && (
            <Box>
              <Alert severity="warning" icon={false} sx={{ mb: 1.5 }}>
                일지 <b>{reviewCount}</b>개 · 다녀왔어요 체크 <b>{visitCount}</b>곳을 <b>내 계정(서버)에 저장</b>해요.
              </Alert>
              <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: '0.9rem', lineHeight: 1.8, wordBreak: 'keep-all' }}>
                <li>작성 날짜는 원래 날짜가 아니라 <b>가져오는 때의 서버 저장 날짜</b>로 기록돼요.</li>
                <li>EXP는 서버 규칙 그대로예요 (일지 EXP 하루 100까지, 하루 일지 20개까지).</li>
                <li>이 브라우저의 원본은 <b>지우지 않아요</b>. 가져온 일지는 나중에 내 계정에서 직접 지울 수 있어요.</li>
                <li>이미 계정에 있는 일지 · 체크는 덮어쓰지 않아요.</li>
                <li>중간에 멈춰도 성공한 기록은 그대로이고, 남은 기록부터 이어서 가져올 수 있어요.</li>
              </Box>
            </Box>
          )}
          {step === 'running' && progress && <ImportProgress index={progress.index} total={progress.total} item={progress.item} />}
          {step === 'result' && outcome && <ImportResult results={outcome.results} summary={outcome.summary} stopped={outcome.stopped} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
          {step === 'preview' && (
            <>
              <Button color="inherit" onClick={close}>
                닫기
              </Button>
              <Button variant="contained" disabled={items.length === 0 || bakeriesLoading} onClick={() => setStep('confirm')}>
                {items.length === 0 ? '가져올 기록을 선택해 주세요' : `선택한 ${items.length}개 가져오기`}
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button color="inherit" onClick={() => setStep('preview')}>
                뒤로
              </Button>
              <Button variant="contained" color="primary" onClick={start}>
                가져오기 시작 (서버에 저장)
              </Button>
            </>
          )}
          {step === 'running' && (
            <Button color="inherit" onClick={() => (stopRef.current = true)}>
              멈추기
            </Button>
          )}
          {step === 'result' && (
            <>
              <Button color="inherit" onClick={close}>
                닫기
              </Button>
              {hasLeftover && (
                <Button variant="contained" onClick={openPreview}>
                  남은 기록 이어서 가져오기
                </Button>
              )}
            </>
          )}
          {step === 'error' && (
            <>
              <Button color="inherit" onClick={close}>
                닫기
              </Button>
              <Button variant="contained" onClick={openPreview}>
                다시 시도
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default LocalImportCard
