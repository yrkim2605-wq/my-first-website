import { useState } from 'react'
import { Box, Button, Container, IconButton, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ImagePlaceholder from '../common/ImagePlaceholder'
import { BEST_SELLERS } from '../../constants/siteData'

const BestSellerSection = () => {
  // 지금 보여 주는 슬라이드 번호를 기억하는 상태
  const [currentIndex, setCurrentIndex] = useState(0)
  const current = BEST_SELLERS[currentIndex]

  const handlePrev = () => {
    setCurrentIndex((index) => (index - 1 + BEST_SELLERS.length) % BEST_SELLERS.length)
  }
  const handleNext = () => {
    setCurrentIndex((index) => (index + 1) % BEST_SELLERS.length)
  }

  return (
    <Box id="best-seller" sx={{ py: 10, scrollMarginTop: 64 }}>
      <Container maxWidth="lg">
        <Typography variant="h2" sx={{ textAlign: 'center', mb: 1 }}>
          Best Seller
        </Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', mb: 6 }}>
          지금 가장 인기 있는 시술과 이벤트를 만나 보세요
        </Typography>

        <Box
          sx={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
            p: { xs: 3, md: 5 },
            borderRadius: 6,
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <ImagePlaceholder
            label={current.name}
            sx={{ height: { xs: 220, md: 340 }, borderRadius: 4, bgcolor: 'primary.light' }}
          />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 4,
              borderRadius: 4,
              bgcolor: 'white',
              color: 'text.primary',
            }}
          >
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              {current.badge}
            </Typography>
            <Typography variant="h2" sx={{ mb: 2, fontSize: '2rem' }}>
              {current.name}
            </Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>
              {current.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {current.description}
            </Typography>
            <Box>
              <Button variant="contained" href="#clinic">
                상담 예약하기
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <IconButton onClick={handlePrev} aria-label="이전 슬라이드">
            <ArrowBackIcon />
          </IconButton>
          {BEST_SELLERS.map((item, index) => (
            <Box
              key={item.id}
              component="button"
              type="button"
              aria-label={`${index + 1}번 슬라이드`}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 10,
                height: 10,
                p: 0,
                border: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: index === currentIndex ? 'primary.main' : 'divider',
              }}
            />
          ))}
          <IconButton onClick={handleNext} aria-label="다음 슬라이드">
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Container>
    </Box>
  )
}

export default BestSellerSection
