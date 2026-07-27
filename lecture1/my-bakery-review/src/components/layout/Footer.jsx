import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{ py: { xs: 5, sm: 7 }, textAlign: 'center', bgcolor: '#205A41' }}
    >
      <Typography variant="body2" sx={{ color: '#F7F1E6' }}>
        © 2026 빵덕후 레벨업. 부산 빵지순례 커뮤니티. 🍞
      </Typography>
    </Box>
  )
}

export default Footer
