import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'

const CommunityPostCard = ({
  categoryLabel,
  title,
  author,
  content,
  heartCount,
  commentCount,
  createdAt,
}) => {
  return (
    <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <CardContent>
        <Chip label={categoryLabel} size="small" variant="outlined" sx={{ mb: 1 }} />
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
            mb: 1,
          }}
        >
          {content}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {author} · {createdAt}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
              <FavoriteIcon fontSize="small" />
              <Typography variant="caption">{heartCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <ChatBubbleOutlineIcon fontSize="small" />
              <Typography variant="caption">{commentCount}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CommunityPostCard
