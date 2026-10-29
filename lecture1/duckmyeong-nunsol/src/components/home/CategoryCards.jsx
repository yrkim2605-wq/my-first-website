import { Box, Container, Paper, Typography } from '@mui/material'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { CATEGORIES } from '../../constants/siteData'

// 히어로 아래로 살짝 겹쳐 올라오는 카테고리 카드
const CategoryCards = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: { xs: -6, md: -9 }, position: 'relative', zIndex: 1 }}>
      <Paper
        elevation={3}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(7, 1fr)' },
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {CATEGORIES.map((category) => (
          <Box
            key={category}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              py: 2.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: '#FFF4ED' },
            }}
          >
            <ImagePlaceholder label="" sx={{ width: 56, height: 56, borderRadius: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {category}
            </Typography>
          </Box>
        ))}
      </Paper>
    </Container>
  )
}

export default CategoryCards
