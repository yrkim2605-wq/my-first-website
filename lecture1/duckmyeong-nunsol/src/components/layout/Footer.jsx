import { Box, Container, Typography } from '@mui/material'
import { COMPANY_INFO } from '../../constants/siteData'

const Footer = () => {
  return (
    <Box component="footer" sx={{ bgcolor: '#F5F6F8', py: 5 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ mb: 1.5 }}>
          대표전화 {COMPANY_INFO.tel}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 2 }}>
          {COMPANY_INFO.name} | 대표 {COMPANY_INFO.ceo} | {COMPANY_INFO.address} <br />
          Tel {COMPANY_INFO.tel} | Fax {COMPANY_INFO.fax} <br />
          상담시간 {COMPANY_INFO.hours}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
          리디자인 연습용 사이트입니다. 이미지는 회색 박스로 대체되었습니다.
        </Typography>
      </Container>
    </Box>
  )
}

export default Footer
