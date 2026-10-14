import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import PlaceIcon from '@mui/icons-material/Place'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import VerifiedIcon from '@mui/icons-material/Verified'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { LEVELS } from '../constants/levels'
import { BAKERY_REVIEWS } from '../constants/bakeryReviews'
import { PARCHMENT_SX, WOOD_PLANK_SX } from '../constants/rpgStyles'
import { getBakeryPhoto } from '../constants/bakeryPhotos'
import { useBusanBakeries } from '../hooks/useBusanBakeries'
import { useVisitedBakeries } from '../hooks/useVisitedBakeries'
import { IS_ACCOUNT_MODE } from '../lib/backend'
import { useRealBakeryPhotos } from '../hooks/useRealBakeryPhotos'
import { useProfile } from '../hooks/useProfile'
import { useReviews } from '../hooks/useReviews'
import { useBakeryRatings } from '../hooks/useBakeryRatings'
import { buildLevelsByUser, kstDate } from '../utils/gameState'
import { getAuthorLevel } from '../utils/authorLevel'
import WoodButton from '../components/common/WoodButton'
import SectionHeading from '../components/common/SectionHeading'
import LocalProfileNotice from '../components/common/LocalProfileNotice'
import ReviewDialog from '../components/bakery/ReviewDialog'
import RewardDialog from '../components/bakery/RewardDialog'
import LevelUpDialog from '../components/bakery/LevelUpDialog'
import ReviewJournalCard from '../components/bakery/ReviewJournalCard'
import BakeryRatingSummary from '../components/bakery/BakeryRatingSummary'
import Sticker from '../components/common/decor/Sticker'
import { DISPLAY_FONT, RADIUS } from '../theme'

const STAR_SX = { '& .MuiRating-iconFilled': { color: 'mustard.main' } }

const TAG_CHIP_SX = { bgcolor: 'rgba(143,166,126,0.18)', color: 'secondary.contrastText', fontWeight: 600 }

// 리뷰가 하나도 없을 때 "이런 모양으로 쌓여요"를 보여주는 안내용 카드 (실제 리뷰가 아니에요)
const SAMPLE_REVIEW_HINT = {
  id: 'sample-hint',
  authorName: '샘플 리뷰어',
  level: null,
  rating: 5,
  content: '일지를 남기면 이런 모양으로 카드가 쌓여요. 이 빵집에 다녀오셨다면 첫 모험 일지를 남겨주세요!',
  dateLabel: '샘플',
  heartCount: 0,
  isMine: false,
  kind: 'sample',
}

// 한국 시간 기준 날짜 (서버 시각은 UTC라서 그대로 자르면 하루 어긋날 수 있어요)
const formatDate = (isoString) => kstDate(isoString)

const BakeryDetail = () => {
  const { id } = useParams()
  const { bakeries: realBakeries, loading: realBakeriesLoading } = useBusanBakeries()
  const { visitedIds, toggleVisited, pendingIds } = useVisitedBakeries()
  const { photosByBakeryId } = useRealBakeryPhotos()
  const { profile } = useProfile()
  const { reviews: allReviews, removeReview, levelsByUserId, reload: reloadReviews } = useReviews()
  const { isEnabled: ratingsEnabled, getRating } = useBakeryRatings()

  // 계정 모드: 상세를 열 때마다 서버의 최신 리뷰 · 평균 별점을 다시 불러와요 (다른 사용자가 남긴 리뷰도 반영돼요)
  useEffect(() => {
    if (IS_ACCOUNT_MODE) reloadReviews()
  }, [id, reloadReviews])

  const mockBakery = BAKERIES.find((b) => String(b.id) === id)
  const realBakery = realBakeries.find((b) => String(b.id) === id)
  const bakery = mockBakery || realBakery

  const [bookmarkedIds, setBookmarkedIds] = useState({})
  // 일지 창은 열 때마다 key를 바꿔서 새로 만들어요 (이전 입력값이 남지 않게)
  const [dialog, setDialog] = useState({ open: false, session: 0 })
  const [reward, setReward] = useState(null)
  const [rewardOpen, setRewardOpen] = useState(false)
  const [levelUp, setLevelUp] = useState(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // 리뷰 작성자별 현재 레벨 (리뷰 카드의 레벨 칭호)
  // 계정 모드: 서버가 계산한 레벨 / 로컬 모드: 이 브라우저의 리뷰로 계산
  const levelsByUser = useMemo(() => levelsByUserId ?? buildLevelsByUser(allReviews), [levelsByUserId, allReviews])

  if (!bakery) {
    if (realBakeriesLoading) {
      return (
        <Container maxWidth="md">
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography color="text.secondary">빵집 정보를 불러오는 중이에요...</Typography>
          </Box>
        </Container>
      )
    }
    return <Navigate to="/" replace />
  }

  const isRealBakery = !mockBakery && Boolean(realBakery)
  const visited = isRealBakery && visitedIds.includes(bakery.id)
  const district = DISTRICTS.find((d) => d.id === bakery.districtId)
  const bookmarked = Boolean(bookmarkedIds[bakery.id])
  const hasUploadedPhoto = Boolean(photosByBakeryId[bakery.id])

  // ── 이 빵집의 일지(리뷰) 모으기: 내 것 → 이 브라우저의 다른 모험가 → 예시 리뷰 순서 ──
  const bakeryIdText = String(bakery.id)
  const storedReviews = allReviews.filter((review) => review.bakeryId === bakeryIdText)
  const myReview = profile ? storedReviews.find((review) => review.userId === profile.userId) : null
  const discovered = isRealBakery && Boolean(myReview)

  const toStoredCard = (review) => ({
    id: review.id,
    authorName: review.authorNickname || '이름 없는 모험가',
    level: levelsByUser[review.userId] ?? LEVELS[0],
    rating: review.rating,
    content: review.content,
    photo: review.photo,
    dateLabel: `${formatDate(review.createdAt)}${review.updatedAt !== review.createdAt ? ' · 수정됨' : ''}`,
    isMine: Boolean(profile) && review.userId === profile.userId,
    kind: 'local',
  })
  const sampleCards = BAKERY_REVIEWS.filter((review) => review.bakeryId === bakery.id).map((review) => ({
    id: `sample-${review.id}`,
    authorName: review.author,
    level: getAuthorLevel(review.author),
    rating: review.rating,
    content: review.content,
    dateLabel: review.createdAt,
    heartCount: review.heartCount,
    isMine: false,
    kind: 'sample',
  }))
  const cards = [
    ...(myReview ? [toStoredCard(myReview)] : []),
    ...storedReviews.filter((review) => review !== myReview).map(toStoredCard),
    ...sampleCards,
  ]

  // 방문 체크: 나만 보는 체크예요. 계정 모드에서는 서버에 저장이 끝난 뒤에 표시가 바뀌고, 실패하면 이유를 알려요.
  const visitPending = pendingIds.includes(bakery.id)
  const handleToggleVisited = async () => {
    try {
      await toggleVisited(bakery)
    } catch (error) {
      setToast({ severity: 'error', message: error.message || '체크하지 못했어요. 잠시 후 다시 시도해 주세요.' })
    }
  }

  const toggleBookmark = () => setBookmarkedIds((prev) => ({ ...prev, [bakery.id]: !prev[bakery.id] }))
  const openDialog = () => setDialog((prev) => ({ open: true, session: prev.session + 1 }))
  const closeDialog = () => setDialog((prev) => ({ ...prev, open: false }))

  // 저장에 성공했을 때만 불려요 (ReviewDialog가 실패하면 이쪽으로 오지 않아요)
  const handleSaved = ({ mode, diff, after }) => {
    closeDialog()
    if (diff.expGained > 0) {
      setReward({ mode, diff, after })
      setRewardOpen(true)
    } else if (mode === 'update') {
      setToast({ severity: 'success', message: '일지를 고쳐 적었어요.' })
    } else {
      // 계정 모드: 하루 EXP 한도를 채운 뒤 쓴 일지는 저장은 되지만 EXP가 없어요
      setToast({ severity: 'success', message: '일지를 남겼어요. 오늘의 EXP 한도를 채워서 이번 일지로는 EXP를 받지 않았어요.' })
    }
  }

  const handleRewardClose = () => {
    setRewardOpen(false)
    if (reward?.diff.leveledUp) {
      const { progress } = reward.after
      setLevelUp({ level: progress.currentLevel, index: progress.currentIndex, expToNext: progress.expToNext, isMaxLevel: progress.isMaxLevel })
    }
  }

  const handleDelete = async () => {
    if (!myReview || deleting) return
    setDeleting(true)
    try {
      await removeReview(myReview.id)
      setConfirmDeleteOpen(false)
      setToast({ severity: 'success', message: '일지를 지웠어요. 이 일지로 얻은 EXP도 함께 사라졌어요.' })
    } catch (error) {
      setToast({ severity: 'error', message: error.message || '지우지 못했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setDeleting(false)
    }
  }

  const listCards = cards.length > 0 ? cards : isRealBakery ? [SAMPLE_REVIEW_HINT] : []

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
        <Typography
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            '@media (pointer: coarse)': { minHeight: 44 },
            gap: 0.75,
            color: 'text.secondary',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: 3,
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '0.85rem' }} />
          전체 빵집으로
        </Typography>

        {/* 탐험지 사진: 위쪽이 둥근 아치, 라벨과 도장은 아치 밖에 둬서 잘리지 않아요 */}
        <Box sx={{ position: 'relative', mb: hasUploadedPhoto || !isRealBakery ? 3 : 1.5 }}>
          <Box
            sx={{
              width: '100%',
              height: { xs: 240, sm: 340 },
              borderRadius: '999px 999px 18px 18px',
              overflow: 'hidden',
              bgcolor: 'butter.main',
              border: '3px solid #c9a56a',
              boxShadow: '0 3px 0 rgba(107,68,35,0.25)',
            }}
          >
            <Box
              component="img"
              src={getBakeryPhoto(bakery.id, photosByBakeryId, bakery.photoSlot)}
              alt={bakery.name}
              className="soft-fade-in"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: 14,
              left: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1.25,
              py: 0.35,
              ...WOOD_PLANK_SX,
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'gold.light',
            }}
          >
            <PlaceIcon sx={{ fontSize: '0.95rem' }} />
            탐험지
          </Box>
          {isRealBakery && (
            <Box
              component="span"
              sx={{
                position: 'absolute',
                bottom: 14,
                right: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.5,
                py: 0.6,
                borderRadius: RADIUS.pill,
                fontSize: '0.85rem',
                fontWeight: 800,
                border: '2px solid #6b4423',
                boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
                ...(discovered
                  ? { bgcolor: 'gold.main', color: 'wood.dark' }
                  : { bgcolor: 'parchment.light', color: 'text.secondary' }),
              }}
            >
              <StarRoundedIcon sx={{ fontSize: '1.05rem' }} />
              {discovered ? '발견 완료' : '미발견'}
            </Box>
          )}
        </Box>
        {isRealBakery && !hasUploadedPhoto && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center', mb: 3 }}>
            대표 사진은 예시예요. 일지에 사진을 붙이면 이 브라우저에서는 이 자리에 보여요.
          </Typography>
        )}

        {/* 탐험지 정보 패널 */}
        <Box component="section" aria-label="탐험지 정보" sx={{ ...PARCHMENT_SX, p: { xs: 2.5, sm: 4 }, borderRadius: '24px', mb: 6 }}>
          {district && (
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: 'terracotta.main', mb: 1 }}>
              탐험 지역 · {district.name}
            </Typography>
          )}
          <Typography variant="h1" sx={{ fontSize: { xs: '1.9rem', sm: '2.5rem' }, color: 'primary.main', mb: 1.5, wordBreak: 'keep-all' }}>
            {bakery.name}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
            <PlaceIcon sx={{ fontSize: '1.1rem', mt: 0.25, color: 'terracotta.main', flexShrink: 0 }} />
            {bakery.address}
          </Typography>
          {bakery.description && <Typography sx={{ mb: 2 }}>{bakery.description}</Typography>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {ratingsEnabled && isRealBakery ? (
              // 계정 모드의 실제 빵집: 서버 집계(모든 사용자의 리뷰)의 평균 별점 · 리뷰 개수
              <BakeryRatingSummary info={getRating(bakery.id)} />
            ) : bakery.rating > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Rating value={bakery.rating} precision={0.5} readOnly size="small" sx={STAR_SX} />
                <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700 }}>
                  {bakery.rating.toFixed(1)}
                </Typography>
              </Box>
            ) : (
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'terracotta.main' }}>
                아직 별점이 없어요
              </Typography>
            )}
            {bakery.heartCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <FavoriteBorderIcon sx={{ fontSize: '1rem' }} />
                {bakery.heartCount}
              </Box>
            )}
            {bakery.signatureMenu && (
              <Typography component="span" sx={{ fontSize: 'inherit', color: 'text.secondary' }}>
                대표 메뉴 · {bakery.signatureMenu}
              </Typography>
            )}
          </Box>

          {(bakery.tags.length > 0 || bakery.placeUrl) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 2.5 }}>
              {bakery.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" sx={TAG_CHIP_SX} />
              ))}
              {bakery.placeUrl && (
                <Chip
                  component="a"
                  href={bakery.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  label="카카오맵에서 보기 ↗"
                  size="small"
                  variant="outlined"
                  color="primary"
                  clickable
                />
              )}
            </Box>
          )}

          {/* 도감 상태: 실제로 저장된 내 리뷰가 있을 때만 "발견 완료"예요 */}
          {isRealBakery && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                mb: 2.5,
                borderRadius: RADIUS.md,
                ...(discovered
                  ? { bgcolor: 'rgba(226,176,74,0.25)', border: '2px solid', borderColor: 'gold.main' }
                  : { bgcolor: 'rgba(255,255,255,0.5)', border: '2px dashed', borderColor: 'parchment.edge' }),
              }}
            >
              <StarRoundedIcon sx={{ color: discovered ? 'gold.dark' : 'text.secondary', flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, wordBreak: 'keep-all' }}>
                {discovered
                  ? '발견 완료! 이 빵집은 내 빵집 도감에 등록됐어요.'
                  : profile
                    ? '아직 발견하지 못한 빵집이에요. 모험 일지를 남기면 도감에 등록돼요.'
                    : '로그인하고 모험 일지를 남기면 이 빵집이 도감에 등록돼요.'}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <WoodButton onClick={openDialog}>{myReview ? '내 일지 고쳐 쓰기' : '모험 일지 쓰기'}</WoodButton>
            {isRealBakery && (
              <Button
                onClick={handleToggleVisited}
                disabled={visitPending}
                variant={visited ? 'contained' : 'outlined'}
                color="primary"
                startIcon={visited ? <VerifiedIcon /> : <VerifiedOutlinedIcon />}
                sx={{ borderRadius: RADIUS.pill }}
              >
                {visitPending ? '저장하는 중…' : visited ? '다녀왔어요 ✓' : '다녀왔어요'}
              </Button>
            )}
            <Button
              onClick={toggleBookmark}
              variant={bookmarked ? 'contained' : 'outlined'}
              color="secondary"
              startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              sx={{ borderRadius: RADIUS.pill, ...(bookmarked ? {} : { color: 'secondary.dark', borderColor: 'secondary.main' }) }}
            >
              {bookmarked ? '찜 완료' : '찜하기'}
            </Button>
          </Box>
          {isRealBakery && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 1.25 }}>
              ‘다녀왔어요’는 <b>나만 보는 체크</b>예요{IS_ACCOUNT_MODE ? ' (내 계정에 저장돼서 다른 기기에서도 보여요)' : ''}. 실제 방문을 인증하지 않아서 EXP · 도감 · 퀘스트에는 반영되지 않아요. 도감과 EXP는 모험 일지를 남길 때 쌓여요.
            </Typography>
          )}
        </Box>

        {/* 모험가들의 기록 */}
        <SectionHeading
          variant="plain"
          eyebrow="ADVENTURERS' LOG"
          title={`모험가들의 기록${cards.length > 0 ? ` (${cards.length})` : ''}`}
          description="이 빵집을 다녀간 모험가들의 일지예요."
          sx={{ mb: 2.5 }}
        />
        <LocalProfileNotice
          sx={{ mb: 2.5 }}
          accountChildren={
            <>
              일지는 <b>계정에 저장</b>되고 다른 모험가에게도 공개돼요. 레벨 칭호는 서버가 계산한 값이에요. ‘예시’ 표시가 붙은 글은 처음부터 들어 있던 샘플이에요.
            </>
          }
        >
          내가 쓴 일지는 <b>이 브라우저에만 저장</b>돼요. 다른 사람과 공유되지 않아요. ‘예시’ 표시가 붙은 글은 처음부터 들어 있던 샘플이에요.
        </LocalProfileNotice>

        {listCards.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Sticker name="knight-breadbed" width={104} sx={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
              아직 기록이 없어요. 이 빵집을 다녀온 첫 모험가가 되어보세요.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cards.length === 0 && (
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                아직 기록이 없어요. 첫 모험 일지를 남기면 아래처럼 보여요.
              </Typography>
            )}
            {listCards.map((card) => (
              <ReviewJournalCard key={card.id} card={card} onEdit={openDialog} onDelete={() => setConfirmDeleteOpen(true)} />
            ))}
          </Box>
        )}
      </Box>

      <ReviewDialog
        key={dialog.session}
        open={dialog.open}
        onClose={closeDialog}
        bakery={bakery}
        isRealBakery={isRealBakery}
        existingReview={myReview ?? null}
        onSaved={handleSaved}
      />

      <RewardDialog open={rewardOpen} reward={reward} onClose={handleRewardClose} />
      <LevelUpDialog open={Boolean(levelUp)} levelUp={levelUp} onClose={() => setLevelUp(null)} />

      {/* 지우기 확인 */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={deleting ? undefined : () => setConfirmDeleteOpen(false)}
        slotProps={{ paper: { sx: { ...PARCHMENT_SX, borderRadius: '20px' } } }}
      >
        <DialogContent>
          <Typography component="h2" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.15rem', color: 'primary.main', mb: 1 }}>
            이 모험 일지를 지울까요?
          </Typography>
          <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', wordBreak: 'keep-all' }}>
            지운 일지는 되돌릴 수 없어요. 이 일지로 얻은 EXP와 빵집 도감 등록도 함께 사라져요.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit" disabled={deleting}>
            취소
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? '지우는 중…' : '지우기'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default BakeryDetail
