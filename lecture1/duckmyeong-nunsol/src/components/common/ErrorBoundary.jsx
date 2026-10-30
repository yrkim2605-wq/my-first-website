import { Component } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { COMPANY_INFO } from '../../constants/siteData'

// 화면을 그리다 오류가 나도 흰 화면 대신 안내를 보여줌 (클래스 컴포넌트여야 오류를 잡을 수 있음)
class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('화면 렌더링 오류:', error)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box
        role="alert"
        sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 3, textAlign: 'center' }}
      >
        <Typography variant="h2">페이지를 불러오지 못했어요</Typography>
        <Typography color="text.secondary" sx={{ wordBreak: 'keep-all' }}>
          잠시 후 다시 시도해 주세요. 계속되면 대표전화 {COMPANY_INFO.tel}로 문의해 주세요.
        </Typography>
        <Button variant="contained" onClick={this.handleReload} sx={{ mt: 1 }}>
          새로고침
        </Button>
      </Box>
    )
  }
}

export default ErrorBoundary
