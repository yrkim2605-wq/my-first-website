import { Box, Container, Paper, Typography } from '@mui/material'
import { CATEGORIES } from '../../constants/siteData'

// 헤더 바로 아래, 히어로 위에 놓이는 카테고리 카드
const CategoryCards = () => {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 2 }, pb: { xs: 2, md: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(4, 1fr)', md: 'repeat(8, 1fr)' },
          gap: { xs: 1, md: 1.5 },
        }}
      >
        {CATEGORIES.map((category) => (
          <Paper
            key={category.id}
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 1, md: 0.5 },
              px: 0.5,
              py: { xs: 1.5, md: 1 },
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'border-color .2s, background-color .2s, box-shadow .2s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: '#FFF4ED',
                boxShadow: '0 4px 12px rgba(242,106,27,0.15)',
              },
            }}
          >
            <Box
              component="img"
              src={category.image}
              alt={category.name}
              sx={{ width: { xs: 56, md: 56 }, height: { xs: 56, md: 56 }, objectFit: 'contain', mixBlendMode: 'multiply' }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                textAlign: 'center',
                wordBreak: 'keep-all',
                lineHeight: 1.4,
                minHeight: { xs: '2.8em', md: '1.4em' },
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '0.75rem', md: '0.8125rem' },
              }}
            >
              {category.name}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Container>
  )
}

export default CategoryCards
