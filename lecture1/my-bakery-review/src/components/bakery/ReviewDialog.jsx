import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Rating from '@mui/material/Rating'
import TextField from '@mui/material/TextField'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import LocalProfileNotice from '../common/LocalProfileNotice'
import Illustration from '../common/decor/Illustration'
import { useProfile } from '../../hooks/useProfile'
import { useReviews } from '../../hooks/useReviews'
import { useGameState } from '../../hooks/useGameState'
import { REVIEW_CONTENT_MAX, REVIEW_CONTENT_MIN, getReviewContentStatus, getShortContentMessage } from '../../utils/reviewContent'
import { createId } from '../../storage/localStore'
import { buildGameState, diffGameState, predictNewReviewExp } from '../../utils/gameState'
import { IS_ACCOUNT_MODE } from '../../lib/backend'
import { resizeImageFile } from '../../utils/resizeImageFile'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 모험 일지 작성 · 수정 창.
// - 저장에 성공한 뒤에만 onSaved를 불러요 (실패하면 창을 닫지 않고 오류를 보여줘요).
// - 같은 창에서 저장 버튼을 두 번 눌러도 한 번만 저장돼요 (저장 중 잠금 + 제출 ID).
// - 부모는 이 창을 열 때마다 key를 바꿔서 새로 만들어요 (입력값이 이전 열기에서 남지 않게).
const ReviewDialog = ({ open, onClose, bakery, isRealBakery, existingReview, onSaved }) => {
  const { profile } = useProfile()
  const { createReview, updateReview, gameSettings } = useReviews()
  const game = useGameState()
  const isEdit = Boolean(existingReview)

  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [photo, setPhoto] = useState(existingReview?.photo ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [errorDebug, setErrorDebug] = useState(null) // 개발 환경에서만 화면에 보여주는 오류 상세 (단계 · 상태 · 코드)
  const requestIdRef = useRef(createId())

  const bakerySource = isRealBakery ? 'kakao' : 'sample'
  // 계정 모드: 예시 빵집은 DB에 없어서 저장할 수 없고, 하루 EXP 상한 · 작성 상한은 서버 규칙과 같게 미리 계산해요
  const sampleBlocked = IS_ACCOUNT_MODE && !isRealBakery
  // 내 기록을 아직 못 불러왔으면(불러오는 중 · 실패) 오늘 받은 EXP를 알 수 없어서 예고하지 않아요 (진짜 지급과 한도는 서버가 정해요)
  const recordUnknown = game.isLoading || Boolean(game.loadError)
  const prediction =
    IS_ACCOUNT_MODE && !isEdit && !sampleBlocked && !recordUnknown
      ? predictNewReviewExp(game.myReviews, { hasPhoto: Boolean(photo), settings: gameSettings?.dailyExpCap != null ? gameSettings : undefined })
      : null
  // 내용은 공백을 뺀 20자 이상, 500자 이하여야 저장할 수 있어요 (서버도 같은 규칙으로 한 번 더 검사해요)
  const contentStatus = getReviewContentStatus(content)
  const canSubmit = contentStatus.isValid && rating >= 0.5 && !submitting && !sampleBlocked && !prediction?.limitReached

  // 저장하면 받게 될 EXP를 미리 계산해서 보여줘요 (저장 전 / 후 상태 비교)
  // 계정 모드: 고쳐 쓰기는 EXP가 변하지 않고, 새 일지는 하루 상한을 반영해요 (진짜 지급은 서버가 정해요)
  const draftReviews = (() => {
    if (IS_ACCOUNT_MODE && (isEdit || sampleBlocked)) return game.myReviews
    if (isEdit) return game.myReviews.map((review) => (review.id === existingReview.id ? { ...review, photo } : review))
    const draft = {
      id: 'draft',
      bakeryId: String(bakery.id),
      bakerySource,
      districtId: bakery.districtId ?? null,
      photo,
      ...(prediction && { expReview: prediction.expReview, expPhoto: prediction.expPhoto, createdAt: new Date().toISOString() }),
    }
    return [draft, ...game.myReviews]
  })()
  const expPreview = recordUnknown ? 0 : diffGameState(game, buildGameState(draftReviews)).expGained

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setPhoto(await resizeImageFile(file))
      setError(null)
    } catch {
      setError('사진을 불러오지 못했어요. 다른 사진으로 시도해 주세요.')
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    setErrorDebug(null)
    const before = game
    try {
      const saved = isEdit
        ? await updateReview(existingReview.id, { rating, content, photo })
        : await createReview({
            bakeryId: bakery.id,
            bakerySource,
            bakeryName: bakery.name,
            districtId: bakery.districtId ?? null,
            bakeryLat: bakery.lat,
            bakeryLng: bakery.lng,
            bakeryAddress: bakery.address,
            rating,
            content,
            photo,
            clientRequestId: requestIdRef.current,
          })
      // 저장에 성공했을 때만 여기까지 와요
      const nextReviews = isEdit
        ? game.myReviews.map((review) => (review.id === saved.id ? saved : review))
        : [saved, ...game.myReviews]
      const after = buildGameState(nextReviews)
      onSaved({ mode: isEdit ? 'update' : 'create', review: saved, diff: diffGameState(before, after), after })
    } catch (saveError) {
      setError(saveError.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
      setErrorDebug(saveError.debug ?? null)
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: '22px', m: { xs: 1.5, sm: 4 }, width: { xs: 'calc(100% - 24px)', sm: undefined } } } }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 0.5 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', color: 'terracotta.main' }}>
          {isEdit ? 'EDIT YOUR LOG' : 'ADVENTURE LOG'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
          {bakery.iconImage && (
            <Box component="img" src={bakery.iconImage} alt="" sx={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
          )}
          <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.2rem', lineHeight: 1.35, color: 'primary.main', wordBreak: 'keep-all' }}>
            {isEdit ? '모험 일지 고쳐 쓰기' : '모험 일지 쓰기'}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.25 }}>탐험지 · {bakery.name}</Typography>
      </Box>

      {!profile ? (
        // 로그인하지 않았으면 일지를 쓸 수 없어요 (사용자별로 기록을 구분하려고 임시 프로필이 필요해요)
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Illustration name="knightCheer" width={120} sx={{ mx: 'auto', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, mb: 0.75 }}>모험 일지를 쓰려면 모험가가 필요해요</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2, wordBreak: 'keep-all' }}>
            {IS_ACCOUNT_MODE
              ? '이메일로 가입하고 인증을 마치면 시작할 수 있어요. 일지는 내 계정에 저장돼요.'
              : '닉네임만 정하면 바로 시작할 수 있어요. (이 브라우저에만 저장되는 임시 프로필이에요)'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button component={Link} to="/signup" variant="contained">
              새 모험가 만들기
            </Button>
            <Button component={Link} to="/login" variant="outlined">
              로그인
            </Button>
          </Box>
        </DialogContent>
      ) : (
        <>
          <DialogContent sx={{ pt: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                별점
              </Typography>
              <Rating
                value={rating}
                precision={0.5}
                onChange={(_, value) => setRating(value || 0)}
                sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
              />
            </Box>
            <TextField
              value={content}
              onChange={(event) => setContent(event.target.value)}
              label="오늘의 모험을 기록해요"
              placeholder="다녀온 소감, 맛, 분위기를 남겨주세요"
              multiline
              minRows={4}
              fullWidth
              slotProps={{ htmlInput: { maxLength: REVIEW_CONTENT_MAX, 'aria-describedby': 'review-content-help' } }}
              helperText={
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'flex-start' }}>
                  <Box
                    component="span"
                    id="review-content-help"
                    aria-live="polite"
                    sx={{
                      fontWeight: contentStatus.isTooShort && content ? 700 : 500,
                      color: !content ? 'text.secondary' : contentStatus.isTooShort ? 'terracotta.main' : 'secondary.dark',
                      wordBreak: 'keep-all',
                    }}
                  >
                    {!content
                      ? `공백을 뺀 ${REVIEW_CONTENT_MIN}자 이상 적어주세요`
                      : contentStatus.isTooShort
                        ? getShortContentMessage(contentStatus.remaining)
                        : '충분히 적었어요!'}
                  </Box>
                  <Box component="span" sx={{ flexShrink: 0 }}>
                    {contentStatus.typedLength}/{REVIEW_CONTENT_MAX}
                  </Box>
                </Box>
              }
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.55)' } }}
            />

            <Box sx={{ mt: 1.5 }}>
              {photo ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25 }}>
                  <Box
                    component="img"
                    src={photo}
                    alt="첨부한 사진 미리보기"
                    sx={{ width: 96, height: 96, borderRadius: RADIUS.md, objectFit: 'cover', border: '2px solid #c9a56a' }}
                  />
                  <Button onClick={() => setPhoto(null)} size="small" color="inherit" sx={{ minHeight: 44 }}>
                    사진 빼기
                  </Button>
                </Box>
              ) : (
                <Button component="label" variant="outlined" size="small" startIcon={<AddAPhotoIcon />}>
                  사진 붙이기
                  <input type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
                </Button>
              )}
            </Box>

            {/* 저장하면 받을 EXP 미리보기 (저장에 성공해야 실제로 지급돼요) */}
            {expPreview > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 2,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: RADIUS.pill,
                  bgcolor: 'butter.main',
                  color: 'butter.contrastText',
                  width: 'fit-content',
                }}
              >
                <StarRoundedIcon sx={{ fontSize: '1.1rem', color: 'gold.dark' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800 }}>저장하면 EXP +{expPreview}</Typography>
              </Box>
            )}

            {/* 계정 모드의 EXP 안내: 하루 상한 · 고쳐 쓰기 · 예시 빵집 */}
            {recordUnknown && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {game.isLoading ? '내 기록을 불러오는 중이라' : '내 기록을 불러오지 못해서'} 받을 EXP를 미리 계산하지 못했어요. 일지는 그대로 저장할 수 있고, EXP와 하루 한도는 서버가 정해요.
              </Alert>
            )}
            {sampleBlocked && (
              <Alert severity="info" sx={{ mt: 2 }}>
                예시 빵집에는 일지를 저장할 수 없어요. 지도에서 실제 빵집을 골라 주세요.
              </Alert>
            )}
            {prediction?.limitReached && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                오늘은 일지를 너무 많이 썼어요 (하루 20개까지). 내일 다시 써 주세요.
              </Alert>
            )}
            {prediction && !prediction.limitReached && !prediction.expReview && (
              <Alert severity="info" sx={{ mt: 2 }}>
                오늘의 EXP 한도를 모두 채워서 이 일지는 <b>EXP 없이</b> 저장돼요. 일지와 빵집 도감에는 그대로 기록돼요.
              </Alert>
            )}
            {prediction?.expReview && photo && !prediction.expPhoto && (
              <Alert severity="info" sx={{ mt: 2 }}>
                오늘 남은 EXP가 모자라서 <b>사진 EXP는 받을 수 없어요</b>. 일지 EXP만 받아요.
              </Alert>
            )}
            {IS_ACCOUNT_MODE && isEdit && (
              <Typography sx={{ mt: 2, fontSize: '0.8rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
                고쳐 쓰기로는 EXP가 늘지도 줄지도 않아요. 사진 EXP는 처음 쓸 때 사진이 있었던 일지만 받아요.
              </Typography>
            )}

            <LocalProfileNotice
              sx={{ mt: 2 }}
              accountChildren={
                <>
                  일지는 <b>내 계정에 저장</b>돼요. 다른 기기에서 로그인해도 볼 수 있고, 다른 모험가에게도 <b>공개</b>돼요.
                </>
              }
            >
              일지는 <b>이 브라우저에만 저장</b>돼요. 다른 사람에게 공유되지 않고, 사이트 데이터를 지우면 사라져요.
            </LocalProfileNotice>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
                {import.meta.env.DEV && errorDebug && (
                  <Box component="code" sx={{ display: 'block', mt: 0.75, fontSize: '0.72rem', opacity: 0.8, wordBreak: 'break-all' }}>
                    [개발용] 단계={errorDebug.step} 출처={errorDebug.source} 상태={String(errorDebug.status)} 코드={String(errorDebug.serverCode ?? errorDebug.code)}
                    {errorDebug.cause ? ` 원인=${errorDebug.cause}` : ''}
                    {errorDebug.probe ? ` 진단=${errorDebug.probe}` : ''}
                    {errorDebug.elapsedMs != null ? ` 걸린시간=${errorDebug.elapsedMs}ms` : ''}
                  </Box>
                )}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={onClose} color="inherit" disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
              {submitting ? '저장하는 중…' : isEdit ? '고쳐 쓰기 저장' : '모험 일지 남기기'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

export default ReviewDialog
