import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import { Link } from 'react-router-dom'

const formatDate = (iso) => new Date(iso).toLocaleDateString('ko-KR')

const PostCard = ({ post }) => (
  <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
    <CardActionArea component={Link} to={`/posts/${post.id}`} sx={{ display: 'flex', alignItems: 'stretch' }}>
      {post.thumbnail && (
        <CardMedia component="img" image={post.thumbnail} alt="" sx={{ width: 120, height: 120, flexShrink: 0 }} />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {post.profiles?.name ?? '익명'} · {formatDate(post.created_at)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1, color: 'text.secondary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FavoriteIcon fontSize="small" />
            <Typography variant="caption">{post.likeCount}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="caption">{post.commentCount}</Typography>
          </Box>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
)

export default PostCard
