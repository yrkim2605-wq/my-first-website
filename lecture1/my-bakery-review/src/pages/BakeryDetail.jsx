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

const TODAY = new Date().toISOString().slice(0, 10)

const BakeryDetail = () => {
  const { id } = useParams()
  const bakery = BAKERIES.find((b) => String(b.id) === id)

  const nextDraftId = useRef(0)
  const [draftReviews, setDraftReviews] = useState([])
  const [bookmarkedIds, setBookmarkedIds] = useState({})
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [draftRating, setDraftRating] = useState(5)
  const [draftContent, setDraftContent] = useState('')

  if (!bakery) {
    return <Navigate to="/" replace />
  }

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

        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2rem', sm: '2.6rem' } }}>
              {bakery.emoji} {bakery.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={district?.name} variant="outlined" />
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
            <Typography variant="body2" color="text.secondary">
              대표메뉴 · {bakery.signatureMenu}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {bakery.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
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
          <Typography variant="body2" color="text.secondary">
            아직 등록된 리뷰가 없어요. 이 빵집을 방문한 첫 리뷰어가 되어보세요.
          </Typography>
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
        <DialogTitle sx={{ fontWeight: 700 }}>{bakery.emoji} {bakery.name} 리뷰 작성</DialogTitle>
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
