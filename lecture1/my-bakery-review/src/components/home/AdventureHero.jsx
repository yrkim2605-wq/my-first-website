import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useLenis } from 'lenis/react'
import Illustration from '../common/decor/Illustration'
import Sparkle from '../common/decor/Sparkle'
import WoodButton from '../common/WoodButton'
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
        pt: { xs: 4, md: 6 },
        pb: { xs: 5, md: 7 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            alignItems: 'center',
            gap: { xs: 1, md: 4 },
          }}
        >
          {/* 캐릭터: 모바일에서는 제목 위에 작게 */}
          <Box sx={{ order: { xs: 0, md: 1 }, position: 'relative', justifySelf: 'center', width: 'fit-content' }}>
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
            <Illustration
              name="knightHero"
              width={{ xs: 190, sm: 250, md: 380 }}
              className="float-soft"
              eager
              sx={{ position: 'relative' }}
            />
            <Sparkle size={30} twinkle sx={{ position: 'absolute', top: '4%', left: '-6%' }} />
            <Sparkle size={18} twinkle delay={0.9} sx={{ position: 'absolute', top: '22%', left: '-12%' }} />
            <Sparkle size={22} twinkle delay={1.7} sx={{ position: 'absolute', bottom: '14%', right: '-8%' }} />
          </Box>

          <Box
            sx={{
              order: { xs: 1, md: 0 },
              textAlign: { xs: 'center', md: 'left' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.2em', color: 'terracotta.main', mb: 1.25 }}>
              BAKERY ADVENTURE
            </Typography>
            <Typography
              id="adventure-title"
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.6rem', md: '3.1rem' },
                lineHeight: 1.25,
                color: 'primary.main',
                wordBreak: 'keep-all',
                textWrap: 'balance',
              }}
            >
              오늘은 어떤 빵집을 정복할까?
            </Typography>
            <Typography
              sx={{
                mt: 2,
                mb: { xs: 3, md: 4 },
                maxWidth: 480,
                fontSize: { xs: '0.95rem', md: '1.1rem' },
                lineHeight: 1.7,
                color: 'text.secondary',
                wordBreak: 'keep-all',
              }}
            >
              빵집을 탐험하고, 리뷰를 남기고, 전설의 빵덕후로 레벨업!
            </Typography>
            <WoodButton onClick={handleStart}>모험 시작하기</WoodButton>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default AdventureHero
