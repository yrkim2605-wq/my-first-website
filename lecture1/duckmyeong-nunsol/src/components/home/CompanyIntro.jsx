import { Box, Container, Divider, Paper, Typography } from '@mui/material'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { BRANDS, COMPANY_INFO, COMPANY_INTRO } from '../../constants/siteData'

// 신뢰 요소: 모두 기존 사이트에 공개된 사실만 사용
// (40년, 공식 대리점은 왼쪽 패널과 제목에 이미 있어서 중복하지 않음)
const TRUST_POINTS = [
  `${BRANDS.length}개 브랜드 취급 (${BRANDS.map((brand) => brand.logo).join(', ')})`,
  '사업자등록 및 통신판매업 신고 사업자',
]

// 회사 소개: 왼쪽 검정 패널(핵심 수치) + 오른쪽 소개글, 하단에 사업자 정보
const CompanyIntro = () => {
  return (
    <Container id="company" maxWidth="lg" sx={{ pb: { xs: 5, md: 6 }, scrollMarginTop: 16 }}>
      <Paper
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '200px 1fr' },
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* 왼쪽: 공식 대리점 + 핵심 수치 */}
        <Box
          sx={{
            bgcolor: '#111',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'center',
            textAlign: { xs: 'left', md: 'center' },
            gap: 1,
            px: 3,
            py: { xs: 2.5, md: 3 },
          }}
        >
          <VerifiedUserIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="caption" sx={{ letterSpacing: 2, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            OFFICIAL DEALER
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography component="span" sx={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: 'primary.main' }}>
              {COMPANY_INTRO.years}
            </Typography>
            <Typography component="span" sx={{ fontSize: '1.125rem', fontWeight: 700, color: 'primary.main' }}>
              +
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            {COMPANY_INTRO.yearsLabel}
          </Typography>
        </Box>

        {/* 오른쪽: 소개글 + 신뢰 요소 + 사업자 정보 */}
        <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 2.5, md: 3 } }}>
          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
            {COMPANY_INTRO.name}
          </Typography>
          <Typography variant="h2" sx={{ mb: 1, fontSize: { xs: '1.125rem', md: '1.25rem' } }}>
            {COMPANY_INTRO.title}
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, wordBreak: 'keep-all', mb: 1.5, fontSize: '0.9375rem' }}>
            {COMPANY_INTRO.descriptions.map((line) => (
              <Box component="span" key={line} sx={{ display: 'block' }}>
                {line}
              </Box>
            ))}
          </Typography>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {TRUST_POINTS.map((point) => (
              <Box component="li" key={point} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {point}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 4, rowGap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              사업자등록번호 {COMPANY_INFO.businessNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              통신판매업 {COMPANY_INFO.salesNumber}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

export default CompanyIntro
