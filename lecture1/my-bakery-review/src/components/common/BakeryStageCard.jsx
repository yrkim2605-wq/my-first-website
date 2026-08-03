import { useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../context/RealBakeryPhotosContext'
import { HOVER_LIFT_SX } from '../../constants/motion'

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
}) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const photoSrc = BAKERY_PHOTO_BY_ID[id] || photosByBakeryId[id] || DEFAULT_BAKERY_PHOTO
  const [bookmarked, setBookmarked] = useState(false)

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
        height: '100%',
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        border: '1px solid rgba(46,42,37,0.07)',
        boxShadow: '0 1px 3px rgba(46,42,37,0.05)',
        ...HOVER_LIFT_SX,
        '&:hover': {
          ...HOVER_LIFT_SX['&:hover'],
          borderColor: 'rgba(46,42,37,0.14)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 148,
          flexShrink: 0,
          overflow: 'hidden',
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
            transition: 'transform 0.4s ease',
            '.MuiCard-root:hover &': {
              transform: 'scale(1.06)',
            },
          }}
        />
        {isNew && (
          <Chip
            label="NEW"
            size="small"
            color="secondary"
            sx={{ position: 'absolute', top: 10, left: 10, fontWeight: 700 }}
          />
        )}
        <IconButton
          onClick={handleBookmarkClick}
          aria-label={bookmarked ? '찜 해제' : '찜하기'}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255,255,255,0.85)',
            transition: 'transform 0.15s ease, background-color 0.15s ease',
            '&:hover': { bgcolor: '#fff', transform: 'scale(1.08)' },
          }}
        >
          {bookmarked ? (
            <BookmarkIcon fontSize="small" sx={{ color: 'primary.main' }} />
          ) : (
            <BookmarkBorderIcon fontSize="small" sx={{ color: 'primary.main' }} />
          )}
        </IconButton>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h3" sx={{ fontSize: '1.1rem' }}>
            {name}
          </Typography>
          <Chip label={districtLabel} size="small" variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {signatureMenu || '메뉴 정보 준비중'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {rating.toFixed(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              리뷰 {reviewCount}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <FavoriteIcon sx={{ fontSize: '0.9rem' }} />
            <Typography variant="caption">{heartCount}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1.5, mb: 1.5 }}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            alignSelf: 'flex-end',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'primary.main',
          }}
        >
          자세히 보기
          <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default BakeryStageCard
