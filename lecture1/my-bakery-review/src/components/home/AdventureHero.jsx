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

// 천천히 흘러가는 구름 (꾸밈용, 클릭을 막지 않아요)
const Cloud = ({ width, sx }) => (
  <Box
    component="svg"
    aria-hidden="true"
    viewBox="0 0 110 62"
    className="drift-slow"
    sx={{ position: 'absolute', width, height: 'auto', pointerEvents: 'none', ...sx }}
  >
    <g fill="#FFFDF5" opacity="0.85">
      <circle cx="30" cy="38" r="16" />
      <circle cx="54" cy="29" r="21" />
      <circle cx="79" cy="38" r="15" />
      <rect x="16" y="38" width="76" height="17" rx="8.5" />
    </g>
  </Box>
)

// 멀리 보이는 언덕과 작은 깃발: 모험이 시작되는 들판 느낌
const Hills = () => (
  <Box aria-hidden="true" sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: { xs: 70, md: 100 }, pointerEvents: 'none' }}>
    <Box component="svg" viewBox="0 0 1440 100" preserveAspectRatio="none" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <path d="M0 100 V52 Q180 8 380 44 T760 38 T1100 50 T1440 32 V100 Z" fill="#8FA67E" opacity="0.26" />
      <path d="M0 100 V70 Q240 38 520 66 T1000 62 T1440 58 V100 Z" fill="#8FA67E" opacity="0.2" />
    </Box>
    {/* 깃발 (넓은 화면에서만) */}
    <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: '9%', bottom: 26, width: 44, height: 70 }}>
      <Box sx={{ position: 'absolute', left: 6, bottom: 0, width: 4, height: 66, borderRadius: 2, bgcolor: 'wood.main' }} />
      <Box
        component="svg"
        viewBox="0 0 34 24"
        className="flag-wave"
        sx={{ position: 'absolute', left: 10, top: 2, width: 34, height: 24 }}
      >
        <path d="M0 0 H34 L26 12 L34 24 H0 Z" fill="#7B2D3B" />
        <circle cx="10" cy="12" r="3.2" fill="#E2B04A" />
      </Box>
    </Box>
  </Box>
)

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
        pb: { xs: 8, md: 11 },
      }}
    >
      {/* 배경 장식: 구름, 언덕 + 깃발 (글자와 지도를 가리지 않는 가장자리에만 둬요) */}
      <Cloud width={{ xs: 70, md: 112 }} sx={{ top: { xs: 14, md: 30 }, left: { xs: '4%', md: '7%' } }} />
      <Cloud width={{ xs: 52, md: 84 }} sx={{ top: { xs: 120, md: 64 }, right: { xs: '3%', md: '9%' }, animationDelay: '-6s' }} />
      <Hills />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
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
            <Illustration name="knightHero" width={{ xs: 190, sm: 250, md: 380 }} className="float-soft" eager sx={{ position: 'relative' }} />
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
