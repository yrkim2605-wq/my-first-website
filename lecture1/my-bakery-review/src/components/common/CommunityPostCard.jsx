import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'
import { BAKERY_PHOTO_BY_ID, DEFAULT_BAKERY_PHOTO } from '../../constants/bakeryPhotos'
import { HOVER_LIFT_SX } from '../../constants/motion'

const AVATAR_BG_COLORS = ['#F3E6D8', '#EFE7DD', '#F5EFE6', '#EADFD3', '#F0E2DD', '#E9E2D8']

const getAvatarColor = (name = '') => {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_BG_COLORS[sum % AVATAR_BG_COLORS.length]
}

const CommunityPostCard = ({
  id,
  categoryLabel,
  title,
  author,
  avatarEmoji,
  authorLevel,
  content,
  heartCount,
  commentCount,
  createdAt,
  photoBakeryId,
}) => {
  const photoSrc = BAKERY_PHOTO_BY_ID[photoBakeryId] || DEFAULT_BAKERY_PHOTO

  return (
    <Card
      elevation={0}
      component={Link}
      to={`/community/${id}`}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
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
      <Box sx={{ position: 'relative', height: 140, flexShrink: 0, overflow: 'hidden' }}>
        <Box
          component="img"
          src={photoSrc}
          alt={title}
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
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Avatar
              variant="rounded"
              src={authorLevel?.iconImage}
              sx={{ width: 34, height: 32, borderRadius: '8px', bgcolor: getAvatarColor(author), fontSize: '1rem' }}
            >
              {avatarEmoji}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {author}
                </Typography>
                {authorLevel && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      px: 0.75,
                      py: 0.15,
                      borderRadius: 999,
                      bgcolor: '#F3D9A8',
                      color: '#7A4A16',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      flexShrink: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    <span>{authorLevel.emoji}</span>
                    {authorLevel.name}
                  </Box>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {createdAt}
              </Typography>
            </Box>
          </Box>
          <Chip label={categoryLabel} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
        </Box>

        <Typography variant="h3" sx={{ fontSize: '1.05rem', mb: 0.5 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {content}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pt: 1.5,
            mt: 'auto',
            borderTop: '1px solid rgba(46,42,37,0.07)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
              <FavoriteIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {heartCount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {commentCount}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            자세히 보기
            <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CommunityPostCard
