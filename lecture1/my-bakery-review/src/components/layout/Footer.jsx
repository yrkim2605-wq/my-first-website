import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { NavLink, useLocation } from 'react-router-dom'
import ScallopEdge from '../common/decor/ScallopEdge'
import Sparkle from '../common/decor/Sparkle'
import HandNote from '../common/decor/HandNote'
import Illustration from '../common/decor/Illustration'
import logo from '../../assets/logo.webp'
import { useProfile } from '../../hooks/useProfile'
import communityScene from '../../assets/community-bg.webp'

const FOOTER_LINKS = [
  { to: '/', label: '홈' },
  { to: '/community', label: '커뮤니티' },
  { to: '/ranking', label: '명예의 전당' },
  { to: '/mypage', label: '내 모험가' },
  { to: '/terms', label: '이용약관' },
  { to: '/privacy', label: '개인정보처리방침' },
]

// 푸터 윗공간 배경 그림: 마을 광장 그림(위 · 안쪽 흐림 포함)이 모든 페이지에서 똑같이 나와요 (하위 주소 포함). 그림을 뺄 페이지는 NO_SCENE_PATHS에 적어요.
//  - 커뮤니티: 마을 광장 + 푸터를 위로 많이 끌어올려요 (mt: 페이지 아래 여백 64px + 300px. 좁은 PC 화면에서는 가로의 1/3 + 20px까지만, 폰은 108px까지만)
//  - 내 모험가: 같은 광장 그림, 푸터를 PC 188px 위로 (폰은 108px). 로그아웃 상태는 PC 288px
//  - 명예의 전당: 같은 광장 그림, 푸터를 PC 388px 위로 (폰은 108px)
//  - 그 밖의 페이지(홈 · 빵집 상세 · 약관 등): 같은 광장 그림, 끌어올리는 양만 작게 (PC 88px · 폰 40px)
const NO_SCENE_PATHS = []
const COMMUNITY_PATH = '/community'
const SCENE_BASE = { image: communityScene, aspectRatio: '1800 / 600', fade: true }
const COMMUNITY_SCENE = { ...SCENE_BASE, mt: { xs: '-108px', md: 'max(-364px, calc(-100vw / 3 - 20px))' } }
const MYPAGE_PATH = '/mypage'
const MYPAGE_SCENE = { ...SCENE_BASE, mt: { xs: '-108px', md: '-188px' } }
// 로그아웃 상태의 내 모험가(안내 카드만 있는 짧은 페이지): 푸터와 그림을 로그인 상태보다 100px 더 올려요 (폰은 안내 카드가 푸터에 닿지 않게 올리지 않고 기본 40px만)
const MYPAGE_LOGGED_OUT_SCENE = { ...SCENE_BASE, mt: { xs: -5, md: '-288px' } }
const RANKING_PATH = '/ranking'
const RANKING_SCENE = { ...SCENE_BASE, mt: { xs: '-108px', md: 'max(-388px, calc(-100vw / 3 - 20px))' } } // 명예의 전당: PC 388px(좁은 PC 화면에서는 가로의 1/3 + 20px까지만) · 폰 108px
const DEFAULT_SCENE = { ...SCENE_BASE, mt: { xs: -5, md: -11 } }
// 위쪽 흐림: 그림 전체의 위쪽 45%가 서서히 나타나요.
const FADE_TOP_MASK = 'linear-gradient(180deg, transparent 0%, #000 45%)'
// 안쪽 흐림: 덤불 · 소품이 가운데로 갈수록 절반(50%)까지만 투명해져요 (양 끝 16%는 그대로). 아래 30%에는 바닥이 서서히 나타나는 칸을 더해서(add) 바닥은 그대로 보이고, 덤불과 바닥 사이에 딱딱한 선이 생기지 않아요.
const FADE_INNER_MASK = 'linear-gradient(180deg, transparent 0%, #000 70%), linear-gradient(90deg, #000 0%, #000 16%, rgba(0,0,0,0.5) 38%, rgba(0,0,0,0.5) 62%, #000 84%, #000 100%)'
const isUnder = (path, base) => path === base || path.startsWith(`${base}/`)

const Footer = () => {
  const { palette } = useTheme()
  const { pathname } = useLocation()
  const { profile, ready } = useProfile()
  const isLoggedOut = ready && !profile
  const scene = NO_SCENE_PATHS.some((path) => isUnder(pathname, path)) ? null : isUnder(pathname, COMMUNITY_PATH) ? COMMUNITY_SCENE : isUnder(pathname, MYPAGE_PATH) ? (isLoggedOut ? MYPAGE_LOGGED_OUT_SCENE : MYPAGE_SCENE) : isUnder(pathname, RANKING_PATH) ? RANKING_SCENE : DEFAULT_SCENE

  return (
    // 그림이 있으면 그림마다 정한 mt로(음수면 위 콘텐츠와의 간격을 좁혀요), 없으면 원래 위쪽 여백이에요.
    <Box component="footer" sx={{ mt: scene ? scene.mt : { xs: 5, md: 6 } }}>
      {scene && (
        // 푸터 윗공간: 마을 길 풍경이 푸터와 겹쳐요. 그림 아래 44px가 푸터 물결 · 푸터 본문 뒤로 들어가서(물결 위 · 푸터는 zIndex 1) 물결 틈으로만 살짝 보여요.
        // 장식이라 화면 읽기 프로그램은 건너뛰어요.
        <Box
          aria-hidden="true"
          sx={{
            position: 'relative',
            top: 20, // 그림만 20px 아래로 (뒤의 위치는 그대로)
            zIndex: 0,
            mb: '-44px',
            opacity: 0.6,
            // 그림을 가로에 맞춰 통째로 보여줘요 (자르지 않아요). 아주 넓은 화면에서는 1920px까지만 커져요.
            width: 'min(100%, 1920px)',
            mx: 'auto',
            aspectRatio: scene.aspectRatio,
            // 위쪽 흐림은 바깥 칸에서 (바닥 띠에는 영향이 없어요)
            ...(scene.fade && { WebkitMaskImage: FADE_TOP_MASK, maskImage: FADE_TOP_MASK }),
            pointerEvents: 'none',
          }}
        >
          {/* 그림 칸: 안쪽 흐림 마스크는 여기에 걸어요 */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${scene.image})`,
              backgroundSize: '100% auto',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center bottom',
              ...(scene.fade && {
                WebkitMaskImage: FADE_INNER_MASK,
                maskImage: FADE_INNER_MASK,
                WebkitMaskSize: '100% 30%, 100% 100%',
                maskSize: '100% 30%, 100% 100%',
                WebkitMaskPosition: 'bottom, top',
                maskPosition: 'bottom, top',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }),
            }}
          />
        </Box>
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <ScallopEdge color={palette.primary.main} position="top" />
      </Box>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textAlign: 'center',
          pt: { xs: 3.5, md: 4 },
          pb: { xs: 3, md: 3.5 },
          px: 3,
        }}
      >
        {/* 모험 종료 화면: 잠든 빵 기사 + 별. 장식은 가운데 정렬된 글자와 겹치지 않는 가장자리에만 둬요. */}
        <Sparkle size={22} twinkle sx={{ position: 'absolute', top: 28, left: { xs: 18, md: '16%' } }} />
        <Sparkle size={14} twinkle delay={1} sx={{ position: 'absolute', top: 64, left: { xs: 48, md: 'calc(16% + 34px)' } }} />
        <Sparkle size={18} twinkle delay={1.8} sx={{ position: 'absolute', top: 40, right: { xs: 22, md: '15%' } }} />
        {/* 왼쪽 아래 구석의 식빵: 가운데 정렬된 메뉴 · 저작권 문구와 겹치지 않는 자리예요 */}
        <Illustration
          name="loaf"
          width={{ xs: 40, md: 64 }}
          sx={{ position: 'absolute', bottom: { xs: 12, md: 22 }, left: { xs: 12, md: '9%' }, transform: 'rotate(-8deg)' }}
        />

        <Illustration name="knightSleep" width={{ xs: 88, md: 104 }} sx={{ mx: 'auto' }} />
        <HandNote color="gold.light" rotate={0} sx={{ mb: 1.5, fontSize: { xs: '0.95rem', md: '1.2rem' } }}>
          오늘의 모험은 여기까지! 내일 또 빵집 탐험을 떠나요
        </HandNote>

        <Box component="img" src={logo} alt="빵덕후 레벨업" sx={{ height: { xs: 60, md: 72 }, width: 'auto', display: 'block', mx: 'auto', mb: 0.5 }} />
        <Typography sx={{ fontSize: '0.85rem', opacity: 0.85, mb: 2 }}>
          부산 빵집을 함께 찾고, 기록하고, 나누는 빵지순례 커뮤니티
        </Typography>

        <Box component="nav" aria-label="하단 메뉴" sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 2.5, sm: 4 }, mb: 2 }}>
          {FOOTER_LINKS.map((link) => (
            <Box
              key={link.to}
              component={NavLink}
              to={link.to}
              end
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                '@media (pointer: coarse)': { minHeight: 44, minWidth: 44 },
                color: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                opacity: 0.85,
                '&:hover': { opacity: 1, color: 'mustard.main' },
              }}
            >
              {link.label}
            </Box>
          ))}
        </Box>

        {/* 가죽 박음질 같은 점선 구분선 */}
        <Box aria-hidden="true" sx={{ maxWidth: 360, mx: 'auto', mb: 1.5, borderTop: '2px dashed rgba(226,176,74,0.45)' }} />
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.8 }}>© 2026 빵덕후 레벨업</Typography>
      </Box>
    </Box>
  )
}

export default Footer
