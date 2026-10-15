import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import LinearProgress from '@mui/material/LinearProgress'
import { DISTRICTS } from '../../constants/districts'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { getReviewContentStatus, getShortContentMessage, REVIEW_CONTENT_MAX } from '../../utils/reviewContent'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 이 브라우저 기록 가져오기의 "화면 조각"들이에요 (서버와 통신하지 않아요: 받은 값을 보여주기만 해요).
//  - ImportNotices  : 꼭 알아야 할 안내 (날짜 · EXP · 원본 보존)
//  - ImportPreview  : 이전 전 미리보기 (가능 / 불가능 목록 + 이유, 짧은 일지 고치기, 선택)
//  - ImportProgress : 진행 중
//  - ImportResult   : 결과 (성공 / 실패 / 시도 못 함 구분)

const STATUS_LABEL = {
  importable: { text: '이전 가능', tone: 'ok' },
  existing: { text: '이미 계정에 있음', tone: 'info' },
  done: { text: '이미 이전함', tone: 'info' },
  sample: { text: '이전 불가 · 예시 빵집', tone: 'no' },
  no_bakery_info: { text: '이전 불가 · 빵집 정보 필요', tone: 'no' },
  too_short: { text: '수정 필요', tone: 'warn' },
  too_long: { text: '수정 필요', tone: 'warn' },
  duplicate: { text: '건너뜀 · 중복', tone: 'info' },
}
const TONE_SX = {
  ok: { bgcolor: 'rgba(143,166,126,0.3)', color: 'secondary.contrastText' },
  info: { bgcolor: 'rgba(46,42,37,0.08)', color: 'text.secondary' },
  warn: { bgcolor: 'rgba(226,176,74,0.35)', color: 'text.primary' },
  no: { bgcolor: 'rgba(179,69,44,0.15)', color: 'error.dark' },
}

const districtName = (districtId) => DISTRICTS.find((district) => district.id === districtId)?.name

const StatusChip = ({ status }) => {
  const label = STATUS_LABEL[status] ?? { text: status, tone: 'info' }
  return (
    <Box component="span" sx={{ px: 1, py: 0.1, borderRadius: RADIUS.pill, fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap', ...TONE_SX[label.tone] }}>
      {label.text}
    </Box>
  )
}

export const ImportNotices = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
    <Alert severity="info" icon={false}>
      <b>작성 날짜는 원래 날짜가 아니라, 가져오는 때의 서버 저장 날짜</b>로 기록돼요. (날짜를 서버가 정하는 규칙이라 바꿀 수 없어요)
    </Alert>
    <Alert severity="info" icon={false}>
      <b>이 브라우저에 있는 기록은 지우지 않고 그대로 남아요.</b> 가져온 일지는 내 계정에 저장되고, 이미 계정에 있는 일지 · 체크는 덮어쓰지 않아요.
    </Alert>
    <Alert severity="info" icon={false}>
      EXP는 <b>서버 규칙 그대로</b> 받아요: 일지 EXP는 하루 100까지, 하루 일지는 20개까지 저장돼요. 한도를 넘는 일지는 EXP 없이 저장되거나 내일로 미뤄져요.
    </Alert>
  </Box>
)

const ReviewRow = ({ review, checked, onToggle, onEdit, disabled }) => {
  const canSelect = review.status === 'importable'
  // 20자 미만(또는 500자 초과) 일지는 이전 전에 고쳐 쓸 수 있어요. 고치는 중에 조건을 채워도 입력창은 그대로 보여요.
  const editable = review.status === 'too_short' || review.status === 'too_long' || review.edited
  const contentStatus = getReviewContentStatus(review.content)
  return (
    <Box component="li" sx={{ display: 'flex', gap: 0.5, py: 1.25, px: { xs: 1, sm: 1.5 }, borderBottom: '1px solid rgba(201,165,106,0.45)', '&:last-of-type': { borderBottom: 'none' }, opacity: canSelect || editable ? 1 : 0.85 }}>
      <Checkbox
        checked={canSelect && checked}
        disabled={!canSelect || disabled}
        onChange={() => onToggle(review.key)}
        slotProps={{ input: { 'aria-label': `${review.bakeryName} 일지 가져오기` } }}
        sx={{ alignSelf: 'flex-start', mt: -0.5 }}
      />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, wordBreak: 'keep-all' }}>{review.bakeryName}</Typography>
          <StatusChip status={review.status} />
          {review.photo.hasPhoto && (
            <Box component="span" sx={{ fontSize: '0.72rem', color: review.photo.ok ? 'text.secondary' : 'error.dark', fontWeight: 700 }}>
              {review.photo.ok ? '사진 포함' : '사진은 제외'}
            </Box>
          )}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {[districtName(review.districtId), `별점 ${review.rating}`, `임시 프로필 ${review.localNickname}`].filter(Boolean).join(' · ')}
        </Typography>
        {review.reason && (
          <Typography sx={{ fontSize: '0.8rem', mt: 0.25, color: STATUS_LABEL[review.status]?.tone === 'no' ? 'error.dark' : 'text.primary', wordBreak: 'keep-all' }}>
            {review.reason}
          </Typography>
        )}
        {review.photo.hasPhoto && !review.photo.ok && review.photo.reason && (
          <Typography sx={{ fontSize: '0.78rem', mt: 0.25, color: 'error.dark', wordBreak: 'keep-all' }}>📷 {review.photo.reason}</Typography>
        )}
        {editable ? (
          <TextField
            value={review.content}
            onChange={(event) => onEdit(review.localId, event.target.value)}
            disabled={disabled}
            multiline
            minRows={2}
            fullWidth
            size="small"
            sx={{ mt: 0.75, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.6)' } }}
            slotProps={{ htmlInput: { maxLength: REVIEW_CONTENT_MAX, 'aria-label': `${review.bakeryName} 일지 내용 고쳐 쓰기` } }}
            helperText={
              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Box component="span" aria-live="polite" sx={{ fontWeight: contentStatus.isTooShort ? 700 : 500, color: contentStatus.isTooShort ? 'terracotta.dark' : 'secondary.dark' }}>
                  {contentStatus.isTooShort ? getShortContentMessage(contentStatus.remaining) : '이전할 수 있어요!'}
                </Box>
                <Box component="span">
                  {contentStatus.typedLength}/{REVIEW_CONTENT_MAX}
                </Box>
              </Box>
            }
          />
        ) : (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
            {review.originalContent}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

const VisitRow = ({ visit, checked, onToggle, disabled }) => {
  const canSelect = visit.status === 'importable'
  return (
    <Box component="li" sx={{ display: 'flex', gap: 0.5, py: 1, px: { xs: 1, sm: 1.5 }, borderBottom: '1px solid rgba(201,165,106,0.45)', '&:last-of-type': { borderBottom: 'none' } }}>
      <Checkbox checked={canSelect && checked} disabled={!canSelect || disabled} onChange={() => onToggle(visit.key)} slotProps={{ input: { 'aria-label': `${visit.bakeryName} 다녀왔어요 체크 가져오기` } }} sx={{ alignSelf: 'flex-start', mt: -0.5 }} />
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 700, wordBreak: 'keep-all' }}>{visit.bakeryName}</Typography>
          <StatusChip status={visit.status} />
        </Box>
        {visit.reason && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', wordBreak: 'keep-all' }}>{visit.reason}</Typography>}
      </Box>
    </Box>
  )
}

const ListBox = ({ children }) => (
  <Box component="ul" sx={{ ...PARCHMENT_SX, listStyle: 'none', m: 0, p: 0, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
    {children}
  </Box>
)

const Heading = ({ children, count }) => (
  <Typography component="h3" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.05rem', color: 'primary.main', mt: 2.5, mb: 1 }}>
    {children}
    {count != null && <Box component="span" sx={{ ml: 0.75, fontSize: '0.9rem', color: 'terracotta.dark' }}>{count}</Box>}
  </Typography>
)

// 이전 전 미리보기
export const ImportPreview = ({ plan, selectedKeys, onToggle, onEdit, simulation, disabled = false }) => {
  const reviewCounts = plan.reviewCounts
  const visitCounts = plan.visitCounts
  const importableReviews = reviewCounts.importable ?? 0
  const importableVisits = visitCounts.importable ?? 0
  const selected = new Set(selectedKeys)
  const reviewsToShow = plan.reviews.filter((review) => review.status !== 'done')
  const visitsToShow = plan.visits.filter((visit) => visit.status !== 'done')
  const alreadyDone = plan.reviews.filter((r) => r.status === 'done').length + plan.visits.filter((v) => v.status === 'done').length
  return (
    <Box>
      <ImportNotices />
      <Box sx={{ ...PARCHMENT_SX, borderRadius: RADIUS.lg, p: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.88rem' }} aria-label="이전 요약">
        <span>이전 가능 일지 <b>{importableReviews}</b>개</span>
        <span>수정하면 가능 <b>{(reviewCounts.too_short ?? 0) + (reviewCounts.too_long ?? 0)}</b>개</span>
        <span>이전 불가 <b>{(reviewCounts.sample ?? 0) + (reviewCounts.no_bakery_info ?? 0)}</b>개</span>
        <span>이미 있음 <b>{(reviewCounts.existing ?? 0) + (reviewCounts.duplicate ?? 0)}</b>개</span>
        <span>다녀왔어요 체크 가능 <b>{importableVisits}</b>곳</span>
        {alreadyDone > 0 && <span>이전 완료 <b>{alreadyDone}</b>개</span>}
      </Box>

      {simulation && importableReviews > 0 && (
        <Alert severity="success" icon={false} sx={{ mt: 1.5 }}>
          <b>예상 결과 (선택한 일지 기준)</b>
          <br />
          오늘 저장 <b>{simulation.savableToday}</b>개 · 그중 EXP를 받는 일지 <b>{simulation.expTargets}</b>개 · 하루 EXP 한도로 EXP 없이 저장 <b>{simulation.noExp}</b>개
          {simulation.deferred > 0 && (
            <>
              <br />
              하루 일지 한도(20개) 때문에 오늘은 못 올리는 일지 <b>{simulation.deferred}</b>개 (내일 이어서 가져와요)
            </>
          )}
          <br />
          예상 EXP <b>+{simulation.expGain}</b> (퀘스트 보너스 포함, 진짜 지급은 서버가 정해요)
        </Alert>
      )}

      <Heading count={reviewsToShow.length}>모험 일지</Heading>
      {reviewsToShow.length === 0 ? (
        <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>가져올 일지가 없어요.</Typography>
      ) : (
        <ListBox>
          {reviewsToShow.map((review) => (
            <ReviewRow key={review.key} review={review} checked={selected.has(review.key)} onToggle={onToggle} onEdit={onEdit} disabled={disabled} />
          ))}
        </ListBox>
      )}

      <Heading count={visitsToShow.length}>다녀왔어요 체크</Heading>
      {visitsToShow.length === 0 ? (
        <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>가져올 체크가 없어요.</Typography>
      ) : (
        <ListBox>
          {visitsToShow.map((visit) => (
            <VisitRow key={visit.key} visit={visit} checked={selected.has(visit.key)} onToggle={onToggle} disabled={disabled} />
          ))}
        </ListBox>
      )}
    </Box>
  )
}

export const ImportProgress = ({ index, total, item }) => (
  <Box role="status" aria-live="polite" sx={{ py: 2 }}>
    <Typography sx={{ fontWeight: 800, mb: 1 }}>
      가져오는 중… {Math.min(index + 1, total)} / {total}
    </Typography>
    <LinearProgress variant="determinate" value={total === 0 ? 0 : (index / total) * 100} sx={{ height: 10, borderRadius: 999 }} />
    {item && <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 1 }}>지금: {item.label}</Typography>}
    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 1 }}>창을 닫지 말고 기다려 주세요. 하나씩 저장하고, 성공한 기록은 바로 기억해 둬요.</Typography>
  </Box>
)

const RESULT_LABEL = {
  success: '성공',
  success_no_photo: '성공 (사진 없이)',
  existing: '이미 있어서 건너뜀',
  failed: '실패',
  not_attempted: '시도 못 함',
}
const RESULT_TONE = { success: 'ok', success_no_photo: 'warn', existing: 'info', failed: 'no', not_attempted: 'info' }

export const ImportResult = ({ results, summary, stopped }) => (
  <Box>
    <Alert severity={summary.failed > 0 || stopped ? 'warning' : 'success'} sx={{ mb: 1.5 }}>
      성공 <b>{summary.success}</b>개{summary.noPhoto > 0 ? ` (그중 사진 없이 ${summary.noPhoto}개)` : ''} · 이미 있어서 건너뜀 <b>{summary.existing}</b>개 · 실패 <b>{summary.failed}</b>개 · 시도 못 함 <b>{summary.notAttempted}</b>개
      {stopped && (
        <>
          <br />
          <b>멈춘 이유:</b> {stopped.message}
        </>
      )}
    </Alert>
    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>
      성공한 기록은 내 계정에 저장됐고, 이 브라우저의 원본은 그대로 남아 있어요. 실패하거나 시도 못 한 기록은 다시 열면 남은 것부터 이어서 가져올 수 있어요.
    </Typography>
    <ListBox>
      {results.map((result) => (
        <Box component="li" key={result.key} sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', py: 1, px: 1.5, borderBottom: '1px solid rgba(201,165,106,0.45)', '&:last-of-type': { borderBottom: 'none' } }}>
          <Typography sx={{ fontWeight: 700, wordBreak: 'keep-all' }}>
            {result.kind === 'visit' ? '체크 · ' : '일지 · '}
            {result.label}
          </Typography>
          <Box component="span" sx={{ px: 1, py: 0.1, borderRadius: RADIUS.pill, fontSize: '0.72rem', fontWeight: 800, ...TONE_SX[RESULT_TONE[result.status] ?? 'info'] }}>
            {RESULT_LABEL[result.status] ?? result.status}
          </Box>
          {result.message && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', width: '100%', wordBreak: 'keep-all' }}>{result.message}</Typography>}
        </Box>
      ))}
    </ListBox>
  </Box>
)
