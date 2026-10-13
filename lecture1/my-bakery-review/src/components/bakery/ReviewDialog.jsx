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
import { REVIEW_CONTENT_MAX } from '../../storage/reviewRepository'
import { createId } from '../../storage/localStore'
import { buildGameState, diffGameState } from '../../utils/gameState'
import { resizeImageFile } from '../../utils/resizeImageFile'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 모험 일지 작성 · 수정 창.
// - 저장에 성공한 뒤에만 onSaved를 불러요 (실패하면 창을 닫지 않고 오류를 보여줘요).
// - 같은 창에서 저장 버튼을 두 번 눌러도 한 번만 저장돼요 (저장 중 잠금 + 제출 ID).
// - 부모는 이 창을 열 때마다 key를 바꿔서 새로 만들어요 (입력값이 이전 열기에서 남지 않게).
const ReviewDialog = ({ open, onClose, bakery, isRealBakery, existingReview, onSaved }) => {
  const { profile } = useProfile()
  const { createReview, updateReview } = useReviews()
  const game = useGameState()
  const isEdit = Boolean(existingReview)

  const [rating, setRating] = useState(existingReview?.rating ?? 5)
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [photo, setPhoto] = useState(existingReview?.photo ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(createId())

  const bakerySource = isRealBakery ? 'kakao' : 'sample'
  const canSubmit = Boolean(content.trim()) && rating >= 0.5 && !submitting

  // 저장하면 받게 될 EXP를 미리 계산해서 보여줘요 (저장 전 / 후 상태 비교)
  const draftReviews = (() => {
    if (isEdit) return game.myReviews.map((review) => (review.id === existingReview.id ? { ...review, photo } : review))
    const draft = { id: 'draft', bakeryId: String(bakery.id), bakerySource, districtId: bakery.districtId ?? null, photo }
    return [draft, ...game.myReviews]
  })()
  const expPreview = diffGameState(game, buildGameState(draftReviews)).expGained

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
    const before = game
    try {
      const saved = isEdit
        ? await updateReview(existingReview.id, { rating, content, photo })
        : await createReview({
            bakeryId: bakery.id,
            bakerySource,
            bakeryName: bakery.name,
            districtId: bakery.districtId ?? null,
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
            닉네임만 정하면 바로 시작할 수 있어요. (이 브라우저에만 저장되는 임시 프로필이에요)
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
              slotProps={{ htmlInput: { maxLength: REVIEW_CONTENT_MAX } }}
              helperText={`${content.length}/${REVIEW_CONTENT_MAX}`}
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
                  <Button onClick={() => setPhoto(null)} size="small" color="inherit" sx={{ minHeight: 36 }}>
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

            <LocalProfileNotice sx={{ mt: 2 }}>
              일지는 <b>이 브라우저에만 저장</b>돼요. 다른 사람에게 공유되지 않고, 사이트 데이터를 지우면 사라져요.
            </LocalProfileNotice>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
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
