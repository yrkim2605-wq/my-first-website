import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { Link } from 'react-router-dom'
import { getBakeryPhoto } from '../../constants/bakeryPhotos'
import { useRealBakeryPhotos } from '../../hooks/useRealBakeryPhotos'
import { HOVER_LIFT_SX } from '../../constants/motion'

const IMAGE_HEIGHT_BY_SIZE = { lg: 220, default: 150, sm: 96 }
const PADDING_BY_SIZE = { lg: 3, default: 2.5, sm: 1.75 }
const CLAMP_BY_SIZE = { lg: 3, default: 2, sm: 1 }
const AUTHOR_FONT_BY_SIZE = { lg: '0.9rem', default: '0.875rem', sm: '0.8rem' }

const PopularReviewCard = ({
  bakeryId,
  bakeryName,
  bakeryEmoji,
  bakeryIconImage,
  avatarEmoji,
  avatarImage,
  avatarScale,
  author,
  rating,
  content,
  size = 'default',
}) => {
  const { photosByBakeryId } = useRealBakeryPhotos()
  const photoSrc = getBakeryPhoto(bakeryId, photosByBakeryId)

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
        '@media (hover: hover)': {
          '&:hover': {
            ...HOVER_LIFT_SX['@media (hover: hover)']['&:hover'],
            borderColor: 'rgba(123,45,59,0.3)',
          },
          '&:hover .review-photo': { transform: 'scale(1.03)' },
        },
      }}
    >
      <Box sx={{ position: 'relative', height: IMAGE_HEIGHT_BY_SIZE[size], flexShrink: 0, overflow: 'hidden', transition: 'height 0.35s ease' }}>
        <Box
          component="img"
          src={photoSrc}
          alt={`${bakeryName} 리뷰 사진`}
          loading="lazy"
          className="review-photo"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
          }}
        />
      </Box>

      <Box sx={{ p: PADDING_BY_SIZE[size], flexGrow: 1, display: 'flex', flexDirection: 'column', transition: 'padding 0.35s ease' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar variant="square" src={avatarImage} sx={{ width: 40, height: 40, fontSize: '1rem', bgcolor: avatarImage ? 'transparent' : 'butter.main', overflow: 'visible', '& img': { objectFit: 'contain', transform: `scale(${avatarScale ?? 1})` } }}>
              {avatarEmoji}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: AUTHOR_FONT_BY_SIZE[size] }}>
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
            WebkitLineClamp: CLAMP_BY_SIZE[size],
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
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
