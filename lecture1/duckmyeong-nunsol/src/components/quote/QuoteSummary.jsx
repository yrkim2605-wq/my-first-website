import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'
import { COMPANY_INFO } from '../../constants/siteData'
import useShop from '../../hooks/useShop'

const SummaryRow = ({ label, children }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {children}
    </Typography>
  </Box>
)

// 오른쪽에 따라다니는 요약 카드: 합계 · 제출 · 문의처 (제출 버튼은 요청 정보 양식과 form 속성으로 연결)
const QuoteSummary = ({ formId, date }) => {
  const { quoteItems, quoteCount, quoteTotal } = useShop()
  const inquiryCount = quoteItems.filter((item) => item.price === null).length
  const telHref = `tel:${COMPANY_INFO.tel.replace(/-/g, '')}`

  return (
    <Paper
      component="aside"
      aria-label="견적 요약"
      variant="outlined"
      sx={{ p: 3, borderRadius: 1.5, borderColor: '#E8EAED', position: { md: 'sticky' }, top: { md: 16 }, alignSelf: 'start' }}
    >
      <Typography variant="h3" component="h2" sx={{ fontSize: '1.125rem' }}>
        견적 요약
      </Typography>
      <Typography variant="caption" color="text.secondary">
        견적일자 {date}
      </Typography>

      <Box role="status" sx={{ mt: 2 }}>
        <SummaryRow label="제품">{quoteItems.length}종</SummaryRow>
        <SummaryRow label="총 수량">{quoteCount}개</SummaryRow>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography sx={{ fontWeight: 700 }}>견적 정가</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'primary.main' }}>
            ₩ {quoteTotal.toLocaleString()}
          </Typography>
        </Box>
        {inquiryCount > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, wordBreak: 'keep-all' }}>
            가격문의 {inquiryCount}종은 합계에 포함되지 않아요. 담당자가 별도로 안내드려요.
          </Typography>
        )}
      </Box>

      <Button type="submit" form={formId} variant="contained" size="large" fullWidth sx={{ mt: 2.5, py: 1.4 }}>
        견적 요청하기
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
        영업일 기준 1일 이내에 연락드려요
      </Typography>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
        바로 문의하기
      </Typography>
      <Box sx={{ display: 'grid', gap: 0.75, fontSize: '0.875rem' }}>
        <Box component="a" href={telHref} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Box component="span" sx={{ fontWeight: 700 }}>
            {COMPANY_INFO.tel}
          </Box>
          <Typography component="span" variant="caption" color="text.secondary">
            {COMPANY_INFO.hours}
          </Typography>
        </Box>
        <Box component="a" href={`mailto:${COMPANY_INFO.email}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MailOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          {COMPANY_INFO.email}
        </Box>
      </Box>
    </Paper>
  )
}

export default QuoteSummary
