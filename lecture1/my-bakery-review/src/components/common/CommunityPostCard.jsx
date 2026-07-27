import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'

const AVATAR_BG_COLORS = ['#F3E6D8', '#EFE7DD', '#F5EFE6', '#EADFD3', '#F0E2DD', '#E9E2D8']

const getAvatarColor = (name = '') => {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_BG_COLORS[sum % AVATAR_BG_COLORS.length]
}

const CommunityPostCard = ({
  categoryLabel,
  title,
  author,
  avatarEmoji,
  authorLevel,
  content,
  heartCount,
  commentCount,
  createdAt,
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid rgba(46,42,37,0.07)',
        boxShadow: '0 1px 3px rgba(46,42,37,0.05)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 16px 28px rgba(46,42,37,0.14)',
          borderColor: 'rgba(46,42,37,0.14)',
        },
      }}
    >
      <CardContent>
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
            gap: 2,
            pt: 1.5,
            borderTop: '1px solid rgba(46,42,37,0.07)',
          }}
        >
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
      </CardContent>
    </Card>
  )
}

export default CommunityPostCard
