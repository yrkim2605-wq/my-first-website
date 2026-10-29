import { Box, Button, ButtonBase, Container, Paper, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { BRANDS } from '../../constants/siteData'

// 로고 이미지가 없는 브랜드는 텍스트로 표시 (brand.logoImage가 있으면 이미지 사용)
const BrandSection = () => {
  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 5, md: 6 } }}>
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
          <ButtonBase
            key={brand.id}
            focusRipple
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 1,
              borderRadius: 1,
              // 카드 전체(로고 + 이름)에 마우스를 올리면 로고 카드가 반응
              '&:hover .brand-card, &.Mui-focusVisible .brand-card': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: '#FFF4ED',
                boxShadow: '0 4px 12px rgba(242,106,27,0.15)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Paper
              className="brand-card"
              variant="outlined"
              sx={{
                height: 72,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.125rem',
                transition: 'all .2s',
              }}
            >
              {brand.logoImage ? (
                <Box component="img" src={brand.logoImage} alt={brand.logo} sx={{ maxWidth: '70%', maxHeight: 36 }} />
              ) : (
                brand.logo
              )}
            </Paper>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {brand.name}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Container>
  )
}

export default BrandSection
