import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import { Link } from 'react-router-dom'

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
  return (
    <Card
      elevation={0}
      component={Link}
      to={`/bakery/${bakeryId}`}
      sx={{
        display: 'block',
        height: '100%',
        p: 2.5,
        bgcolor: 'background.paper',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid rgba(46,42,37,0.07)',
        boxShadow: '0 1px 3px rgba(46,42,37,0.05)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 18px 32px rgba(46,42,37,0.16)',
          borderColor: 'rgba(46,42,37,0.14)',
        },
      }}
    >
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {bakeryIconImage ? (
          <Box component="img" src={bakeryIconImage} alt="" sx={{ width: 18, height: 18, objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: '0.9rem', lineHeight: 1 }}>{bakeryEmoji}</Typography>
        )}
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {bakeryName}
        </Typography>
      </Box>
    </Card>
  )
}

export default PopularReviewCard
