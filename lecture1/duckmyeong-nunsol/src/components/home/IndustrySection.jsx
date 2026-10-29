import { Box, Button, Container, IconButton, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { INDUSTRIES } from '../../constants/siteData'

const IndustrySection = () => {
  return (
    <Box sx={{ bgcolor: '#111', color: '#fff', py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, mb: 2 }}>
          산업 현장의 <br />
          정확한 선택, 덕명눈솔
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
          다양한 산업 분야의 정밀 측정 장비와 공구를 제공합니다.
        </Typography>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ bgcolor: '#fff', color: '#111', borderRadius: 8, px: 3, mb: 6, '&:hover': { bgcolor: '#f0f0f0' } }}
        >
          산업별 솔루션 보기
        </Button>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2,
          }}
        >
          {INDUSTRIES.map((industry) => (
            <Box
              key={industry}
              sx={{
                height: 140,
                borderRadius: 2,
                bgcolor: '#3A3D42',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                p: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#4A4D52' },
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>{industry}</Typography>
              <IconButton
                size="small"
                aria-label={`${industry} 보기`}
                sx={{ bgcolor: '#fff', color: '#111', '&:hover': { bgcolor: '#f0f0f0' } }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  )
}

export default IndustrySection
