import { Box, Button, Container, Paper, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { BRANDS } from '../../constants/siteData'

const BrandSection = () => {
  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h2">브랜드 바로가기</Typography>
        <Button color="inherit" size="small" endIcon={<ArrowForwardIcon />} sx={{ ml: 'auto' }}>
          전체 브랜드 보기
        </Button>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' },
          gap: 2,
        }}
      >
        {BRANDS.map((brand) => (
          <Box key={brand.id} sx={{ textAlign: 'center' }}>
            <Paper
              variant="outlined"
              sx={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.125rem',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              {brand.logo}
            </Paper>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
              {brand.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  )
}

export default BrandSection
