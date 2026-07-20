import { useParams, Link, Navigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew'
import { BAKERIES } from '../constants/bakeries'
import { DISTRICTS } from '../constants/districts'
import { BAKERY_REVIEWS } from '../constants/bakeryReviews'

const BakeryDetail = () => {
  const { id } = useParams()
  const bakery = BAKERIES.find((b) => String(b.id) === id)

  if (!bakery) {
    return <Navigate to="/" replace />
  }

  const district = DISTRICTS.find((d) => d.id === bakery.districtId)
  const reviews = BAKERY_REVIEWS.filter((r) => r.bakeryId === bakery.id)

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
            <Chip label={district?.name} variant="outlined" />
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

        <Typography variant="h2" sx={{ mb: 2 }}>
          방문자 리뷰 ({reviews.length})
        </Typography>

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
                    <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{review.avatarEmoji}</Typography>
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
    </Container>
  )
}

export default BakeryDetail
