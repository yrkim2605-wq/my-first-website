import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Breadcrumbs, Button, Container, Link, Paper, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import QuoteItemTable from '../components/quote/QuoteItemTable'
import QuoteProductSearch from '../components/quote/QuoteProductSearch'
import QuoteRequestForm from '../components/quote/QuoteRequestForm'
import QuoteSection from '../components/quote/QuoteSection'
import QuoteSidebar from '../components/quote/QuoteSidebar'
import { COMPANY_INFO } from '../constants/siteData'
import useShop from '../hooks/useShop'
import usePageTitle from '../hooks/usePageTitle'
import { scrollToId } from '../utils/scroll'

// 접수가 끝난 뒤 보여주는 화면
const QuoteComplete = ({ summary, onRestart }) => {
  const navigate = useNavigate()

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
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
        <Button variant="outlined" onClick={onRestart}>
          새 견적 작성
        </Button>
      </Box>
    </Paper>
  )
}

// 온라인 견적 접수: 1) 제품 검색 → 2) 견적 제품 관리 → 3) 견적 요청 정보 (기존 사이트의 온라인 견적 흐름)
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Breadcrumbs aria-label="현재 위치" sx={{ mb: 1.5, fontSize: '0.875rem' }}>
        <Link component={RouterLink} to="/" color="text.secondary" underline="hover">
          홈
        </Link>
        <Typography color="text.primary" sx={{ fontSize: 'inherit' }}>
          온라인견적
        </Typography>
      </Breadcrumbs>
      <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, mb: 4 }}>
        온라인 견적 접수
      </Typography>

      {summary ? (
        <QuoteComplete summary={summary} onRestart={() => setSummary(null)} />
      ) : (
        <>
          <QuoteSection id="quote-search" step={1} title="견적 제품 검색" hint="제품을 검색한 뒤 견적서에 추가할 수 있어요">
            <QuoteProductSearch />
          </QuoteSection>

          <QuoteSection id="quote-items" step={2} title="견적 제품 관리" hint="아래 제품을 견적 요청해요">
            <QuoteItemTable />
          </QuoteSection>

          <QuoteSection step={3} title="견적 요청 정보" hint={`견적일자 | ${today}`}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' }, gap: { xs: 4, md: 5 } }}>
              <QuoteRequestForm hasItems={quoteItems.length > 0} onEmptyList={handleEmptyList} onSubmit={handleSubmit} />
              <QuoteSidebar />
            </Box>
          </QuoteSection>
        </>
      )}
    </Container>
  )
}

export default QuotePage
