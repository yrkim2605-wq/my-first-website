import { useEffect, useState } from 'react'
import { Box, Container, IconButton, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { HERO_SLIDES } from '../../constants/siteData'

const AUTO_PLAY_INTERVAL = 5000

const formatNumber = (number) => String(number).padStart(2, '0')

const controlButtonSx = {
  width: { xs: 24, md: 30 },
  height: { xs: 24, md: 30 },
  color: '#fff',
  '&:hover': { bgcolor: 'primary.main' },
}

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const slideCount = HERO_SLIDES.length

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slideCount)
  }

  const handlePlayToggle = () => {
    setIsPlaying((prev) => !prev)
  }

  // 자동 재생: 5초마다 다음 슬라이드로 (재생 중일 때만)
  useEffect(() => {
    if (!isPlaying) return undefined
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount)
    }, AUTO_PLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [isPlaying, slideCount, currentIndex])

  return (
    <Container maxWidth="lg">
      {/* 다른 섹션과 같은 폭(1200px)에 원본 비율(1140:600)을 그대로 따름 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          aspectRatio: '1140 / 600',
          borderRadius: { xs: 2, md: 3 },
          bgcolor: '#0A0A0A',
        }}
      >
        {/* 슬라이드 트랙: 가로로 이어 붙이고 translateX로 이동 */}
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.6s ease',
          }}
        >
          {HERO_SLIDES.map((slide, index) => (
            <Box
              key={slide}
              component="img"
              src={slide}
              alt={`덕명눈솔 메인 배너 ${index + 1}`}
              sx={{ flex: '0 0 100%', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ))}
        </Box>

        {/* 우측 하단 컨트롤: 번호 + 이전/다음/재생 */}
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 6, md: 24 },
            bottom: { xs: 6, md: 24 },
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            px: { xs: 0.5, md: 1 },
            py: { xs: 0.25, md: 0.5 },
            bgcolor: 'rgba(0,0,0,0.55)',
            borderRadius: 8,
          }}
        >
          {/* 번호: 자릿수가 달라져도 폭이 흔들리지 않게 고정 */}
          <Typography
            variant="body2"
            sx={{
              width: { xs: 44, md: 56 },
              textAlign: 'center',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: { xs: '0.6875rem', md: '0.875rem' },
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatNumber(currentIndex + 1)}
            <Box component="span" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 400 }}>
              {' '}
              / {formatNumber(slideCount)}
            </Box>
          </Typography>
          <Box sx={{ width: '1px', height: 14, bgcolor: 'rgba(255,255,255,0.35)', mx: 0.5 }} />
          <IconButton aria-label="이전 배너" onClick={handlePrev} sx={controlButtonSx}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton aria-label="다음 배너" onClick={handleNext} sx={controlButtonSx}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={handlePlayToggle}
            aria-label={isPlaying ? '자동 재생 정지' : '자동 재생 시작'}
            sx={controlButtonSx}
          >
            {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
    </Container>
  )
}

export default HeroSection
