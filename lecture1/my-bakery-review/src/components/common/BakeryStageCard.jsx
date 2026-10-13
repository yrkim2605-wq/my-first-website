import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import { Link } from 'react-router-dom'
import { getBakeryPhoto } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../hooks/useRealBakeryPhotos'
import { RADIUS } from '../../theme'

// 사진 위쪽을 둥근 아치 모양으로 깎아요. 사진이 낮으면 브라우저가 비율을 줄여 완만한 돔이 돼요.
const ARCH_RADIUS = '999px 999px 14px 14px'

const BakeryStageCard = ({
  id,
  name,
  districtLabel,
  signatureMenu,
  rating,
  heartCount,
  reviewCount = 0,
  isNew = false,
  tags = [],
  variant = 'default',
  height,
  photoSlot,
}) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const photoSrc = getBakeryPhoto(id, photosByBakeryId, photoSlot)
  const [bookmarked, setBookmarked] = useState(false)
  const hasReviews = reviewCount > 0 || rating > 0

  const handleBookmarkClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setBookmarked((prev) => !prev)
  }

  return (
    <Card
      elevation={0}
      component={Link}
      to={`/bakery/${id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: height ?? '100%',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        border: '1px solid rgba(59,42,34,0.08)',
        boxShadow: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'rgba(123,45,59,0.35)',
          boxShadow: '0 10px 24px rgba(59,42,34,0.08)',
        },
        '&:hover .bakery-name': { color: 'primary.main' },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          mx: 1.5,
          mt: 1.5,
          borderRadius: ARCH_RADIUS,
          bgcolor: 'butter.main',
          ...(height
            ? { flex: '1 1 auto', minHeight: 0 }
            : variant === 'featured'
              ? { height: { xs: 220, sm: 290, md: 330 }, flexShrink: 0 }
              : variant === 'square'
                ? { aspectRatio: '1 / 1', maxHeight: { xs: 220, sm: 290, md: 330 }, flexShrink: 0 }
                : { height: 190, flexShrink: 0 }),
        }}
      >
        <Box
          component="img"
          src={photoSrc}
          alt={name}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
            '.MuiCard-root:hover &': { transform: 'scale(1.04)' },
          }}
        />
        {isNew && (
          <Chip
            label="NEW"
            size="small"
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              bgcolor: 'terracotta.main',
              color: 'terracotta.contrastText',
            }}
          />
        )}
        <IconButton
          onClick={handleBookmarkClick}
          aria-label={bookmarked ? '찜 해제' : '찜하기'}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'rgba(251,246,234,0.92)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          {bookmarked ? (
            <BookmarkIcon fontSize="small" sx={{ color: 'primary.main' }} />
          ) : (
            <BookmarkBorderIcon fontSize="small" sx={{ color: 'primary.main' }} />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0.75, pt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography
            variant="h3"
            className="bakery-name"
            sx={{
              fontSize: variant === 'featured' ? '1.2rem' : '1.05rem',
              transition: 'color 0.15s ease',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {name}
          </Typography>
          {districtLabel && (
            <Typography
              component="span"
              sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'secondary.dark', flexShrink: 0, pt: 0.4 }}
            >
              {districtLabel}
            </Typography>
          )}
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
          {signatureMenu ? `대표 메뉴 · ${signatureMenu}` : '메뉴 정보 준비 중'}
        </Typography>

        {hasReviews ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: '0.8rem', color: 'text.secondary' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={rating}
                precision={0.5}
                readOnly
                size="small"
                sx={{ '& .MuiRating-iconFilled': { color: 'mustard.main' } }}
              />
              <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 700, color: 'text.primary' }}>
                {rating.toFixed(1)}
              </Typography>
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: '0.95rem' }} />
              {reviewCount}
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <FavoriteBorderIcon sx={{ fontSize: '0.95rem' }} />
              {heartCount}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.8rem', color: 'terracotta.main', fontWeight: 600 }}>
            아직 리뷰가 없어요 · 첫 리뷰를 남겨주세요
          </Typography>
        )}

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{ bgcolor: 'rgba(143,166,126,0.18)', color: 'secondary.contrastText', borderRadius: RADIUS.pill }}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default BakeryStageCard
