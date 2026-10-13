import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { NavLink } from 'react-router-dom'
import ScallopEdge from '../common/decor/ScallopEdge'
import FlatFlower from '../common/decor/FlatFlower'
import mascotLogo from '../../assets/logo-mascot-photo.webp'

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

        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Box component="img" src={mascotLogo} alt="" sx={{ width: 34, height: 40, objectFit: 'contain' }} />
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, fontFamily: '"OwnglyphParkDaHyun", cursive', lineHeight: 1 }}>
            <Box component="span" sx={{ fontSize: '1.8rem' }}>빵덕후</Box>
            <Box component="span" sx={{ fontSize: '1.2rem', color: 'mustard.main' }}>레벨업</Box>
          </Box>
        </Box>
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

        <Typography sx={{ fontSize: '0.75rem', opacity: 0.6 }}>© 2026 빵덕후 레벨업</Typography>
      </Box>
    </Box>
  )
}

export default Footer
