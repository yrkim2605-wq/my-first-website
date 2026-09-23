import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { Link } from 'react-router-dom'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../context/RealBakeryPhotosContext'
import { HOVER_LIFT_SX } from '../../constants/motion'

const PopularReviewCard = ({
  bakeryId,
  bakeryName,
  bakeryEmoji,
  bakeryIconImage,
  avatarEmoji,
  avatarImage,
  author,
  rating,
  content,
}) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const photoSrc = BAKERY_PHOTO_BY_ID[bakeryId] || photosByBakeryId[bakeryId] || DEFAULT_BAKERY_PHOTO

  return (
    <Card
      elevation={0}
      component={Link}
      to={`/bakery/${bakeryId}`}
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
      <Box sx={{ position: 'relative', height: 130, flexShrink: 0, overflow: 'hidden' }}>
        <Box
          component="img"
          src={photoSrc}
          alt={`${bakeryName} 리뷰 사진`}
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
      </Box>

      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar variant="rounded" src={avatarImage} sx={{ width: 28, height: 26, borderRadius: '7px', fontSize: '1rem' }}>
              {avatarEmoji}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {author}
            </Typography>
          </Box>
          <Rating value={rating} precision={0.5} readOnly size="small" />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
            minHeight: '2.6em',
          }}
        >
          {content}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
          {bakeryIconImage ? (
            <Box component="img" src={bakeryIconImage} alt="" sx={{ width: 18, height: 18, objectFit: 'contain' }} />
          ) : (
            <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{bakeryEmoji}</Typography>
          )}
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {bakeryName}
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}

export default PopularReviewCard
