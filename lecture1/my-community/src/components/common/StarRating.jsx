import Rating from '@mui/material/Rating'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const StarRating = ({ value, count, onChange, readOnly = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Rating
      value={value}
      precision={readOnly ? 0.1 : 1}
      readOnly={readOnly}
      onChange={(_e, newValue) => onChange?.(newValue)}
      sx={{ color: 'primary.main' }}
    />
    {readOnly && (
      <Typography variant="body2" color="text.secondary">
        {value ? value.toFixed(1) : '0.0'}
        {typeof count === 'number' ? ` (${count})` : ''}
      </Typography>
    )}
  </Box>
)

export default StarRating
