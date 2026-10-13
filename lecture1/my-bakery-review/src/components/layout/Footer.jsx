import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'
import ScallopEdge from '../common/decor/ScallopEdge'
import FlatFlower from '../common/decor/FlatFlower'
import Illustration from '../common/decor/Illustration'
import logo from '../../assets/logo.webp'

const FOOTER_LINKS = [
  { to: '/', label: '홈' },
  { to: '/community', label: '커뮤니티' },
  { to: '/ranking', label: '랭킹' },
  { to: '/mypage', label: '마이페이지' },
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
        <FlatFlower petal={palette.mustard.main} center={palette.primary.main} size={48} sx={{ position: 'absolute', top: 24, left: { xs: 16, md: '12%' } }} />
        <FlatFlower petal={palette.background.paper} center={palette.terracotta.main} size={34} sx={{ position: 'absolute', bottom: 28, right: { xs: 20, md: '14%' }, opacity: 0.9 }} />
        {/* 왼쪽 아래 구석의 식빵: 가운데 정렬된 메뉴 · 저작권 문구와 겹치지 않는 자리예요 */}
        <Illustration
          name="loaf"
          width={{ xs: 48, md: 84 }}
          sx={{ position: 'absolute', bottom: { xs: 12, md: 22 }, left: { xs: 12, md: '9%' }, transform: 'rotate(-8deg)' }}
        />

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
