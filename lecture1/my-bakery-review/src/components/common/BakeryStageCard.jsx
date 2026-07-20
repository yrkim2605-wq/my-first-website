import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import FavoriteIcon from '@mui/icons-material/Favorite'

const BakeryStageCard = ({
  name,
  districtLabel,
  emoji,
  signatureMenu,
  rating,
  heartCount,
  tags = [],
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        transition: 'transform 0.15s',
        '&:hover': { transform: 'translateY(-3px)' },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h3" sx={{ fontSize: '1.1rem' }}>
            {emoji} {name}
          </Typography>
          <Chip label={districtLabel} size="small" variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {signatureMenu}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main' }}>
            <FavoriteIcon fontSize="small" />
            <Typography variant="body2">{heartCount}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}

export default BakeryStageCard
