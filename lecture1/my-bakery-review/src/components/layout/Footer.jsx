import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'
import ScallopEdge from '../common/decor/ScallopEdge'
import Sparkle from '../common/decor/Sparkle'
import HandNote from '../common/decor/HandNote'
import Illustration from '../common/decor/Illustration'
import logo from '../../assets/logo.webp'

const FOOTER_LINKS = [
  { to: '/', label: '홈' },
  { to: '/community', label: '커뮤니티' },
  { to: '/ranking', label: '명예의 전당' },
  { to: '/mypage', label: '내 모험가' },
]

const Footer = () => {
  const { palette } = useTheme()

  return (
    <Box component="footer" sx={{ mt: { xs: 6, md: 8 } }}>
      <ScallopEdge color={palette.primary.main} position="top" />
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textAlign: 'center',
          pt: { xs: 5, md: 6 },
          pb: { xs: 4, md: 5 },
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
          width={{ xs: 48, md: 84 }}
          sx={{ position: 'absolute', bottom: { xs: 12, md: 22 }, left: { xs: 12, md: '9%' }, transform: 'rotate(-8deg)' }}
        />

        <Illustration name="knightSleep" width={{ xs: 120, md: 150 }} sx={{ mx: 'auto' }} />
        <HandNote color="gold.light" rotate={0} sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.45rem' } }}>
          오늘의 모험은 여기까지! 내일 또 빵집 탐험을 떠나요
        </HandNote>

        <Box component="img" src={logo} alt="빵덕후 레벨업" sx={{ height: { xs: 84, md: 104 }, width: 'auto', display: 'block', mx: 'auto', mb: 1 }} />
        <Typography sx={{ fontSize: '0.9rem', opacity: 0.85, mb: 3 }}>
          부산 빵집을 함께 찾고, 기록하고, 나누는 빵지순례 커뮤니티
        </Typography>

        <Box component="nav" aria-label="하단 메뉴" sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: { xs: 2.5, sm: 4 }, mb: 3 }}>
          {FOOTER_LINKS.map((link) => (
            <Box
              key={link.to}
              component={NavLink}
              to={link.to}
              end
              sx={{
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
        <Box aria-hidden="true" sx={{ maxWidth: 360, mx: 'auto', mb: 2, borderTop: '2px dashed rgba(226,176,74,0.45)' }} />
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.6 }}>© 2026 빵덕후 레벨업</Typography>
      </Box>
    </Box>
  )
}

export default Footer
