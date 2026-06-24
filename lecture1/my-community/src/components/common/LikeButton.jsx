import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'

const LikeButton = ({ liked, count, onToggle, disabled }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <IconButton onClick={onToggle} disabled={disabled} color="primary">
      {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
    <Typography variant="body2" color="text.secondary">
      {count}
    </Typography>
  </Box>
)

export default LikeButton
