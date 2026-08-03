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
import FavoriteIcon from '@mui/icons-material/Favorite'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import EditIcon from '@mui/icons-material/EditOutlined'
import Avatar from '@mui/material/Avatar'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS } from '../constants/bakeryReviews'
import { MOCK_USER } from '../constants/userProfile'
import { getAuthorLevel } from '../utils/authorLevel'
import { useBusanBakeries } from '../context/BusanBakeriesContext'
import { useVisitedBakeries } from '../context/VisitedBakeriesContext'
import { useRealBakeryPhotos } from '../context/RealBakeryPhotosContext'
import { resizeImageFile } from '../utils/resizeImageFile'
import VerifiedIcon from '@mui/icons-material/Verified'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'

const TODAY = new Date().toISOString().slice(0, 10)

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

        {isRealBakery && (
          <Box
            sx={{
              width: '100%',
              height: { xs: 200, sm: 280 },
              borderRadius: 3,
              overflow: 'hidden',
              mb: 3,
              bgcolor: '#F3D9A8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {photosByBakeryId[bakery.id] ? (
              <Box
                component="img"
                src={photosByBakeryId[bakery.id]}
                alt={bakery.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Typography variant="body2" sx={{ color: '#7A4A16', fontWeight: 600, textAlign: 'center', px: 2 }}>
                아직 등록된 사진이 없어요. 리뷰 작성할 때 사진을 올려보세요!
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '2rem', sm: '2.6rem' }, display: 'flex', alignItems: 'center', gap: 1.25 }}
            >
              {bakery.iconImage ? (
                <Box
                  component="img"
                  src={bakery.iconImage}
                  alt=""
                  sx={{ width: '1.5em', height: '1.5em', objectFit: 'contain', flexShrink: 0 }}
                />
              ) : (
                bakery.emoji
              )}
              {bakery.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={district?.name} variant="outlined" />
              {isRealBakery && (
                <Button
                  onClick={() => toggleVisited(bakery.id)}
                  variant={visited ? 'contained' : 'outlined'}
                  color="primary"
                  startIcon={visited ? <VerifiedIcon /> : <VerifiedOutlinedIcon />}
                  size="small"
                >
                  {visited ? '방문 인증 완료' : '다녀왔어요'}
                </Button>
              )}
              <Button
                onClick={toggleBookmark}
                variant={bookmarked ? 'contained' : 'outlined'}
                color="secondary"
                startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                size="small"
              >
                {bookmarked ? '찜 완료' : '찜하기'}
              </Button>
            </Box>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {bakery.address}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {bakery.description}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Rating value={bakery.rating} precision={0.5} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {bakery.rating}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
              <FavoriteIcon fontSize="small" />
              <Typography variant="body2">{bakery.heartCount}</Typography>
            </Box>
            {bakery.signatureMenu && (
              <Typography variant="body2" color="text.secondary">
                대표메뉴 · {bakery.signatureMenu}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {bakery.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
            {bakery.placeUrl && (
              <Chip
                component="a"
                href={bakery.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                label="카카오맵에서 보기"
                size="small"
                variant="outlined"
                color="primary"
                clickable
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="h2">
            방문자 리뷰 ({reviews.length})
          </Typography>
          <Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenDialog}>
            리뷰 작성
          </Button>
        </Box>

        {reviews.length === 0 ? (
          isRealBakery ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                아직 등록된 진짜 리뷰가 없어요. 이런 모양으로 표시될 예정이에요 (아래는 샘플입니다):
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SAMPLE_REVIEWS.map((review) => (
                  <Box
                    key={review.id}
                    sx={{
                      position: 'relative',
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px dashed rgba(46,42,37,0.25)',
                      bgcolor: 'rgba(46,42,37,0.03)',
                    }}
                  >
                    <Chip
                      label="샘플"
                      size="small"
                      color="secondary"
                      sx={{ position: 'absolute', top: 10, right: 10, fontWeight: 700 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar variant="rounded" sx={{ width: 34, height: 32, borderRadius: '8px', fontSize: '1rem' }}>
                          {review.avatarEmoji}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {review.author}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {review.createdAt}
                          </Typography>
                        </Box>
                      </Box>
                      <Rating value={review.rating} precision={0.5} readOnly size="small" />
                    </Box>
                    <Typography variant="body2">{review.content}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              아직 등록된 리뷰가 없어요. 이 빵집을 방문한 첫 리뷰어가 되어보세요.
            </Typography>
          )
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <Box
                key={review.id}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'rgba(46,42,37,0.08)',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      variant="rounded"
                      src={getAuthorLevel(review.author).iconImage}
                      sx={{ width: 34, height: 32, borderRadius: '8px', fontSize: '1rem' }}
                    >
                      {review.avatarEmoji}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {review.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {review.createdAt}
                      </Typography>
                    </Box>
                  </Box>
                  <Rating value={review.rating} precision={0.5} readOnly size="small" />
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {review.content}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
                  <FavoriteIcon fontSize="small" />
                  <Typography variant="caption">{review.heartCount}</Typography>
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
                    sx={{ width: 96, height: 96, borderRadius: 2, objectFit: 'cover', display: 'block' }}
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
