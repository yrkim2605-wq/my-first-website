import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{ py: 3, textAlign: 'center', borderTop: '1px solid rgba(46,42,37,0.08)' }}
    >
      <Typography variant="body2" color="text.secondary">
        © 2026 빵덕후 레벨업. 부산 빵지순례 커뮤니티. 🍞
      </Typography>
    </Box>
  )
}

export default Footer
