import { Box, Container, Divider, Typography } from '@mui/material'
import { COMPANY_INFO, FOOTER_LINKS } from '../../constants/siteData'

// 라벨 + 값 한 줄
const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.25 }}>
    <Typography variant="body2" sx={{ width: 104, flexShrink: 0, fontWeight: 500, lineHeight: 1.7 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, wordBreak: 'keep-all' }}>
      {value}
    </Typography>
  </Box>
)

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#F5F6F8', pt: 4, pb: 5 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, md: 3 }, mb: 2.5 }}>
          {FOOTER_LINKS.map((link) => (
            <Typography key={link} variant="body2" sx={{ fontWeight: 500, cursor: 'pointer' }}>
              {link}
            </Typography>
          ))}
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, gap: { xs: 3, md: 6 } }}>
          {/* 회사 정보 */}
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>{COMPANY_INFO.name}</Typography>
            <InfoRow label="대표" value={COMPANY_INFO.ceo} />
            <InfoRow label="사업자등록번호" value={COMPANY_INFO.businessNumber} />
            <InfoRow label="통신판매업" value={COMPANY_INFO.salesNumber} />
            <InfoRow label="주소" value={COMPANY_INFO.address} />
            <InfoRow label="E-mail" value={COMPANY_INFO.email} />
          </Box>

          {/* 연락처 + 입금계좌 */}
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>고객센터</Typography>
            <InfoRow label="대표전화" value={COMPANY_INFO.tel} />
            <InfoRow label="부산 지사" value={COMPANY_INFO.branchTel} />
            <InfoRow label="팩스" value={COMPANY_INFO.fax} />
            <InfoRow label="상담시간" value={COMPANY_INFO.hours} />
            <InfoRow label="입금계좌" value={`${COMPANY_INFO.bank} (예금주 ${COMPANY_INFO.accountHolder})`} />
          </Box>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mt: 4, color: 'text.secondary' }}>
          리디자인 포트폴리오 작업물입니다. 상품 이미지는 플레이스홀더로 대체되었습니다.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
