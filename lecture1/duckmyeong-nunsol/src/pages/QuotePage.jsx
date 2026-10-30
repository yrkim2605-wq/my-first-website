import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Breadcrumbs, Button, Container, Link, Paper, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import QuoteItemList from '../components/quote/QuoteItemList'
import QuoteProductSearch from '../components/quote/QuoteProductSearch'
import QuoteRequestForm from '../components/quote/QuoteRequestForm'
import QuoteSection from '../components/quote/QuoteSection'
import QuoteSummary from '../components/quote/QuoteSummary'
import { COMPANY_INFO } from '../constants/siteData'
import useShop from '../hooks/useShop'
import usePageTitle from '../hooks/usePageTitle'
import { scrollToId } from '../utils/scroll'

const QUOTE_FORM_ID = 'quote-form'

// 접수가 끝난 뒤 보여주는 화면
const QuoteComplete = ({ summary, onRestart }) => {
  const navigate = useNavigate()

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 7 }, textAlign: 'center', borderRadius: 1.5, borderColor: '#E8EAED' }}>
      <CheckCircleIcon sx={{ fontSize: 56, color: 'primary.main' }} />
      <Typography variant="h2" component="h2" sx={{ mt: 1 }}>
        견적 요청이 접수되었어요
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5, wordBreak: 'keep-all', lineHeight: 1.8 }}>
        {summary.company} {summary.name}님, 제품 {summary.lineCount}종(수량 {summary.quantity}개) 견적 요청을 받았어요.
        <br />
        영업일 기준 1일 이내에 연락드릴게요. 급하시면 {COMPANY_INFO.tel}로 전화해 주세요.
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        * 데모 사이트라 실제로 전송되지는 않았어요.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 3 }}>
        <Button variant="contained" onClick={() => navigate('/')}>
          쇼핑 계속하기
        </Button>
        <Button variant="outlined" color="inherit" onClick={onRestart} sx={{ borderColor: '#D5D8DD' }}>
          새 견적 작성
        </Button>
      </Box>
    </Paper>
  )
}

// 온라인 견적 접수: 제품 찾기 → 담은 제품 확인 → 요청 정보 입력, 오른쪽 요약 카드에서 제출
const QuotePage = () => {
  usePageTitle('온라인 견적 | DMNS 덕명눈솔')
  const { quoteItems, quoteCount, clearQuote, notify } = useShop()
  const [summary, setSummary] = useState(null)
  const [today] = useState(() =>
    new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
  )

  const handleEmptyList = () => {
    notify('견적 목록에 제품을 먼저 담아 주세요', 'warning')
    scrollToId('quote-search')
  }

  const handleSubmit = (values) => {
    setSummary({ company: values.company, name: values.name, lineCount: quoteItems.length, quantity: quoteCount })
    clearQuote()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Box sx={{ bgcolor: '#F7F8FA', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Breadcrumbs aria-label="현재 위치" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
          <Link component={RouterLink} to="/" color="text.secondary" underline="hover">
            홈
          </Link>
          <Typography color="text.primary" sx={{ fontSize: 'inherit' }}>
            온라인견적
          </Typography>
        </Breadcrumbs>
        <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2rem' } }}>
          온라인 견적
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: { xs: 3, md: 4 }, wordBreak: 'keep-all' }}>
          필요한 제품을 담고 연락처를 남겨 주세요. 영업일 기준 1일 이내에 견적을 보내드려요.
        </Typography>

        {summary ? (
          <QuoteComplete summary={summary} onRestart={() => setSummary(null)} />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <Box sx={{ display: 'grid', gap: 3 }}>
              <QuoteSection id="quote-search" step={1} title="제품 찾기">
                <QuoteProductSearch />
              </QuoteSection>

              <QuoteSection id="quote-items" step={2} title="담은 제품" hint={`${quoteItems.length}종`}>
                <QuoteItemList />
              </QuoteSection>

              <QuoteSection step={3} title="요청 정보">
                <QuoteRequestForm
                  formId={QUOTE_FORM_ID}
                  hasItems={quoteItems.length > 0}
                  onEmptyList={handleEmptyList}
                  onSubmit={handleSubmit}
                />
              </QuoteSection>
            </Box>

            <QuoteSummary formId={QUOTE_FORM_ID} date={today} />
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default QuotePage
