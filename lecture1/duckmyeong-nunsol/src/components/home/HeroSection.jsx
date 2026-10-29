import { Box, Button, Container, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const HeroSection = () => {
  return (
    <Box sx={{ bgcolor: '#111', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 사진 자리 (회색 박스) */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          left: { xs: 0, md: '45%' },
          bgcolor: '#3A3D42',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: '0.875rem',
        }}
      >
        히어로 이미지 (측정기 사진)
      </Box>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #111 35%, rgba(17,17,17,0.6) 65%, rgba(17,17,17,0.2))',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', pt: { xs: 8, md: 14 }, pb: { xs: 12, md: 18 } }}>
        <Typography variant="h3" sx={{ color: 'primary.main', mb: 2 }}>
          Mitutoyo
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, mb: 3 }}>
          정밀한 측정이 <br />
          더 나은 결과를 만듭니다.
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 4, lineHeight: 1.8 }}>
          40년, 덕명눈솔은 신뢰할 수 있는 <br />
          정밀측정기를 제공합니다.
        </Typography>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            bgcolor: '#fff',
            color: '#111',
            borderRadius: 8,
            px: 3,
            py: 1.25,
            '&:hover': { bgcolor: '#f0f0f0' },
          }}
        >
          Mitutoyo 제품 보러가기
        </Button>
        <Typography sx={{ position: 'absolute', right: 24, bottom: 96, color: 'primary.main', fontWeight: 700 }}>
          01{' '}
          <Box component="span" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
            / 03
          </Box>
        </Typography>
      </Container>
    </Box>
  )
}

export default HeroSection
