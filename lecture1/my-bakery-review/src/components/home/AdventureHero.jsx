import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useLenis } from 'lenis/react'
import Illustration from '../common/decor/Illustration'
import Sparkle from '../common/decor/Sparkle'
import WoodButton from '../common/WoodButton'
import heroBackground from '../../assets/hero-bg.webp'
import { WORLD_MAP_SECTION_ID } from '../../constants/sectionIds'

// 홈 첫 화면: RPG 시작 화면처럼 타이틀과 빵 기사에 시선이 모여요.
// [모험 시작하기]를 누르면 아래 "빵지순례 월드맵"(카카오맵)으로 부드럽게 내려가요.
const SCROLL_OFFSET = -100 // 고정 헤더에 가려지지 않도록

const AdventureHero = () => {
  const lenis = useLenis()

  const handleStart = () => {
    const target = document.getElementById(WORLD_MAP_SECTION_ID)
    if (!target) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (lenis) lenis.scrollTo(target, { offset: SCROLL_OFFSET, immediate: prefersReducedMotion })
    else target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <Box
      component="section"
      aria-labelledby="adventure-title"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        // 높이는 고정하지 않고 "최소 높이"만 둬요. 글이 길어져도 잘리지 않아요.
        minHeight: { xs: 400, sm: 380, md: 450 },
        pt: { xs: 2.5, md: 3 },
        pb: { xs: 6, sm: 5, md: 4 },
      }}
    >
      {/* 배경 그림: 언덕 위 빵 마을과 부산 바다. 왼쪽은 글자가 읽히도록 아주 옅은 크림색 막을 덮어요 */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          // 비율은 그대로 두고(cover), 비어 있는 하늘 쪽이 먼저 잘리도록 아래쪽 풍경을 기준으로 맞춰요
          backgroundPosition: { xs: '24% bottom', sm: 'center 78%', md: 'center 72%' },
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          background: {
            xs: 'linear-gradient(180deg, rgba(251,244,228,0.55) 0%, rgba(251,244,228,0.78) 55%, rgba(251,244,228,0.3) 100%)',
            md: 'linear-gradient(90deg, rgba(251,244,228,0.82) 0%, rgba(251,244,228,0.6) 40%, rgba(251,244,228,0) 70%)',
          },
          pointerEvents: 'none',
        }}
      />

      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: { xs: 40, md: 36 },
          background: (theme) => `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${theme.palette.background.default} 100%)`,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.2fr 0.8fr', md: '1.15fr 0.85fr' },
            alignItems: 'center',
            gap: { xs: 0.5, sm: 2, md: 4 },
          }}
        >
          {/* 캐릭터: 모바일에서는 제목 위에 작게 */}
          <Box sx={{ order: { xs: 0, sm: 1 }, position: 'relative', justifySelf: 'center', width: 'fit-content' }}>
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                inset: '8% 4% 2%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(248,213,122,0.55) 0%, rgba(248,213,122,0) 68%)',
                pointerEvents: 'none',
              }}
            />
            <Illustration name="knightHero" width={{ xs: 140, sm: 230, md: 420 }} className="float-soft" eager sx={{ position: 'relative' }} />
            <Sparkle size={30} twinkle sx={{ position: 'absolute', top: '4%', left: '-6%' }} />
            <Sparkle size={18} twinkle delay={0.9} sx={{ position: 'absolute', top: '22%', left: '-12%' }} />
            <Sparkle size={22} twinkle delay={1.7} sx={{ position: 'absolute', bottom: '14%', right: '-8%' }} />
          </Box>

          <Box
            sx={{
              order: { xs: 1, sm: 0 },
              textAlign: { xs: 'center', sm: 'left' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.2em', color: 'terracotta.dark', mb: 1.25 }}>
              BAKERY ADVENTURE
            </Typography>
            <Typography
              id="adventure-title"
              variant="h1"
              sx={{
                fontSize: { xs: '2.3rem', sm: '2.7rem', md: '3.6rem' },
                lineHeight: 1.25,
                textShadow: '0 2px 0 rgba(255,250,235,0.85), 0 0 18px rgba(251,244,228,0.9)',
                color: 'primary.main',
                wordBreak: 'keep-all',
                textWrap: 'balance',
              }}
            >
              오늘은 어떤 빵집을 정복할까?
            </Typography>
            <Typography
              sx={{
                mt: { xs: 1.5, md: 2 },
                mb: { xs: 2.5, md: 4 },
                maxWidth: 540,
                fontSize: { xs: '1.05rem', sm: '1.1rem', md: '1.25rem' },
                fontWeight: 600,
                lineHeight: 1.7,
                color: 'text.primary',
                textShadow: '0 1px 0 rgba(255,250,235,0.9), 0 0 12px rgba(251,244,228,0.95)',
                wordBreak: 'keep-all',
                textWrap: 'balance',
              }}
            >
              빵집을 탐험하고, 리뷰를 남기고, 전설의 빵덕후로 레벨업!
            </Typography>
            <WoodButton
              onClick={handleStart}
              sx={{ px: { xs: 4.5, sm: 6 }, py: { xs: 1.5, sm: 1.8 }, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}
            >
              모험 시작하기
            </WoodButton>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default AdventureHero
