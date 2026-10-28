import { Box, Container, Typography } from '@mui/material'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { SPECIALS } from '../../constants/siteData'

const SpecialSection = () => {
  return (
    <Box
      id="special"
      sx={{
        py: 10,
        scrollMarginTop: 64,
        background: 'linear-gradient(180deg, #ffffff 0%, #e6f6f4 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 1 }}>
          Dr. Evers Special
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 8 }}>
          아름다운 나를 찾는 건강한 약속을 위한 에버스만의 특별함
        </Typography>

        {SPECIALS.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: index % 2 === 0 ? '380px 1fr' : '1fr 380px' },
              alignItems: 'center',
              gap: { xs: 3, md: 8 },
              mb: 8,
            }}
          >
            {/* 짝수 번째는 사진과 글의 좌우 순서를 바꿔요 */}
            <ImagePlaceholder
              sx={{
                height: { xs: 360, md: 560 },
                borderRadius: index % 2 === 0 ? '300px 80px 80px 80px' : '80px 300px 80px 80px',
                order: { md: index % 2 === 0 ? 0 : 1 },
              }}
            />
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
                {item.eyebrow}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 3 }}>
                {item.title}
              </Typography>
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {item.points.map((point) => (
                  <Box
                    key={point}
                    sx={{ px: 3, py: 1.5, borderRadius: 3, bgcolor: 'white', boxShadow: '0 4px 16px rgba(15, 143, 137, 0.1)' }}
                  >
                    <Typography variant="body2">{point}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Container>
    </Box>
  )
}

export default SpecialSection
