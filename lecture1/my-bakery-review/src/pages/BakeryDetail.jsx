import { useRef, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import EditIcon from '@mui/icons-material/EditOutlined'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS } from '../constants/bakeryReviews'
import { MOCK_USER } from '../constants/userProfile'
import { useBusanBakeries } from '../hooks/useBusanBakeries'
import { useVisitedBakeries } from '../hooks/useVisitedBakeries'
import { useRealBakeryPhotos } from '../hooks/useRealBakeryPhotos'
import { resizeImageFile } from '../utils/resizeImageFile'
import AuthorInfo from '../components/common/AuthorInfo'
import { getBakeryPhoto } from '../constants/bakeryPhotos'
import VerifiedIcon from '@mui/icons-material/Verified'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import { RADIUS } from '../theme'

const TODAY = new Date().toISOString().slice(0, 10)

const STAR_SX = { '& .MuiRating-iconFilled': { color: 'mustard.main' } }

const TAG_CHIP_SX = { bgcolor: 'rgba(143,166,126,0.18)', color: 'secondary.contrastText', fontWeight: 600 }

const REVIEW_CARD_SX = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: RADIUS.lg,
  border: '1px solid rgba(59,42,34,0.1)',
  bgcolor: 'background.paper',
}

const SAMPLE_REVIEWS = [
  {
    id: 'sample-1',
    author: '샘플 리뷰어',
    avatarEmoji: '✨',
    rating: 5,
    content: '리뷰를 작성하면 이런 모양으로 카드가 쌓여요. 이 빵집에 다녀오셨다면 첫 실제 리뷰를 남겨주세요!',
    createdAt: '샘플',
    heartCount: 0,
  },
]

const BakeryDetail = () => {
  const { id } = useParams()
  const { bakeries: realBakeries, loading: realBakeriesLoading } = useBusanBakeries()
  const { visitedIds, toggleVisited } = useVisitedBakeries()
  const { photosByBakeryId, setBakeryPhoto } = useRealBakeryPhotos()

  const mockBakery = BAKERIES.find((b) => String(b.id) === id)
  const realBakery = realBakeries.find((b) => String(b.id) === id)
  const bakery = mockBakery || realBakery

  const nextDraftId = useRef(0)
  const [draftReviews, setDraftReviews] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState({})
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [draftRating, setDraftRating] = useState(5)
  const [draftContent, setDraftContent] = useState('')
  const [draftPhoto, setDraftPhoto] = useState(null)

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
  const reviews = [
    ...draftReviews.filter((r) => r.bakeryId === bakery.id),
    ...BAKERY_REVIEWS.filter((r) => r.bakeryId === bakery.id),
  ]

  const toggleBookmark = () => {
    setBookmarkedIds((prev) => ({ ...prev, [bakery.id]: !prev[bakery.id] }))
  }

  const handleOpenDialog = () => setDialogOpen(true)
  const handleCloseDialog = () => {
    setDialogOpen(false)
    setDraftRating(5)
    setDraftContent('')
    setDraftPhoto(null)
  }

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const dataUrl = await resizeImageFile(file)
    setDraftPhoto(dataUrl)
  }

  const handleSubmitReview = () => {
    if (!draftContent.trim()) return
    nextDraftId.current += 1
    const newReview = {
      id: `draft-${nextDraftId.current}`,
      bakeryId: bakery.id,
      author: MOCK_USER.nickname,
      avatarEmoji: MOCK_USER.avatarEmoji,
      rating: draftRating,
      content: draftContent.trim(),
      createdAt: TODAY,
      heartCount: 0,
    }
    setDraftReviews((prev) => [newReview, ...prev])
    if (isRealBakery && draftPhoto) {
      setBakeryPhoto(bakery.id, draftPhoto)
    }
    handleCloseDialog()
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
        <Typography
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            color: 'text.secondary',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: 4,
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '0.85rem' }} />
          전체 빵집으로
        </Typography>

        <Box
          sx={{
            width: '100%',
            height: { xs: 240, sm: 340 },
            // 위쪽이 둥근 아치 모양
            borderRadius: '999px 999px 18px 18px',
            overflow: 'hidden',
            bgcolor: 'butter.main',
            mb: hasUploadedPhoto || !isRealBakery ? 4 : 1.5,
          }}
        >
          <Box
            component="img"
            src={getBakeryPhoto(bakery.id, photosByBakeryId, bakery.photoSlot)}
            alt={bakery.name}
            className="soft-fade-in"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        {isRealBakery && !hasUploadedPhoto && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center', mb: 4 }}>
            대표 사진은 예시예요. 리뷰를 쓸 때 사진을 올려주시면 이 자리에 보여요.
          </Typography>
        )}

        <Box sx={{ mb: 6 }}>
          {district && (
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', color: 'terracotta.main', mb: 1 }}>
              {district.name}
            </Typography>
          )}
          <Typography variant="h1" sx={{ fontSize: { xs: '1.9rem', sm: '2.5rem' }, color: 'primary.main', mb: 1.5 }}>
            {bakery.name}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{bakery.address}</Typography>
          {bakery.description && <Typography sx={{ mb: 2 }}>{bakery.description}</Typography>}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {bakery.rating > 0 ? (
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 3 }}>
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isRealBakery && (
              <Button
                onClick={() => toggleVisited(bakery.id)}
                variant={visited ? 'contained' : 'outlined'}
                color="primary"
                startIcon={visited ? <VerifiedIcon /> : <VerifiedOutlinedIcon />}
                sx={{ borderRadius: RADIUS.pill }}
              >
                {visited ? '방문 인증 완료' : '다녀왔어요'}
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
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
          <Typography variant="h2" sx={{ color: 'primary.main', fontSize: { xs: '1.4rem', sm: '1.6rem' } }}>
            방문자 리뷰 {reviews.length > 0 && `(${reviews.length})`}
          </Typography>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenDialog} sx={{ borderRadius: RADIUS.pill, px: 2.5 }}>
            리뷰 작성
          </Button>
        </Box>

        {reviews.length === 0 ? (
          isRealBakery ? (
            <Box>
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2 }}>
                아직 리뷰가 없어요. 첫 리뷰를 남기면 아래처럼 보여요.
              </Typography>
              {SAMPLE_REVIEWS.map((review) => (
                <Box
                  key={review.id}
                  sx={{ ...REVIEW_CARD_SX, position: 'relative', borderStyle: 'dashed', bgcolor: 'transparent' }}
                >
                  <Chip
                    label="샘플"
                    size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 700, bgcolor: 'butter.main', color: 'butter.contrastText' }}
                  />
                  <AuthorInfo author={review.author} level={null} caption={review.createdAt} sx={{ mb: 1.5 }} />
                  <Typography sx={{ fontSize: '0.9rem' }}>{review.content}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
              아직 리뷰가 없어요. 이 빵집을 다녀온 첫 리뷰어가 되어보세요.
            </Typography>
          )
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <Box key={review.id} sx={REVIEW_CARD_SX}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <AuthorInfo author={review.author} caption={review.createdAt} />
                  <Rating value={review.rating} precision={0.5} readOnly size="small" sx={STAR_SX} />
                </Box>
                <Typography sx={{ fontSize: '0.95rem', lineHeight: 1.7, mb: 1.25 }}>{review.content}</Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                  <FavoriteBorderIcon sx={{ fontSize: '1rem' }} />
                  {review.heartCount}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          {bakery.iconImage ? (
            <Box
              component="img"
              src={bakery.iconImage}
              alt=""
              sx={{ width: '1em', height: '1em', objectFit: 'contain', flexShrink: 0 }}
            />
          ) : (
            bakery.emoji
          )}
          {bakery.name} 리뷰 작성
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              별점
            </Typography>
            <Rating
              value={draftRating}
              precision={0.5}
              onChange={(_, value) => setDraftRating(value || 0)}
            />
          </Box>
          <TextField
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="다녀온 소감을 남겨주세요"
            multiline
            minRows={3}
            fullWidth
          />
          {isRealBakery && (
            <Box sx={{ mt: 2 }}>
              {draftPhoto ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={draftPhoto}
                    alt=""
                    sx={{ width: 96, height: 96, borderRadius: RADIUS.md, objectFit: 'cover', display: 'block' }}
                  />
                  <Button
                    onClick={() => setDraftPhoto(null)}
                    size="small"
                    color="inherit"
                    sx={{ mt: 0.5, minWidth: 0, minHeight: 36, px: 1.25, py: 1, fontSize: '0.75rem' }}
                  >
                    사진 제거
                  </Button>
                </Box>
              ) : (
                <Button component="label" variant="outlined" size="small" startIcon={<AddAPhotoIcon />}>
                  사진 추가
                  <input type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            취소
          </Button>
          <Button onClick={handleSubmitReview} variant="contained" disabled={!draftContent.trim()}>
            등록하기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default BakeryDetail
