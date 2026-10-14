import { Component } from 'react'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import StatusMessage from './StatusMessage'
import { isChunkLoadError, reportClientError } from '../../utils/reportClientError'

// 화면을 그리다 오류가 났을 때 하얀 화면 대신 안내를 보여줘요.
//  - resetKey가 바뀌면(다른 페이지로 이동하면) 오류 상태를 풀고 다시 그려요.
//  - 오류 내용은 이용자에게 보여주지 않아요 (기록만 남겨요: reportClientError).
//  - 맨 바깥(main.jsx)에도 하나 두기 때문에, 라우터 없이도 동작하도록 이동은 주소(hash)로 해요.
export const ErrorFallback = ({ error }) => {
  const isStale = isChunkLoadError(error)
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: { xs: 5, sm: 8 } }}>
        <StatusMessage
          mood="error"
          title={isStale ? '새 버전이 나왔어요' : '문제가 생겼어요'}
          description={
            isStale
              ? '화면을 새로고침하면 최신 버전으로 열려요.'
              : '화면을 불러오다가 문제가 생겼어요. 새로고침해도 계속되면 잠시 후 다시 시도하거나 문의처로 알려 주세요.'
          }
          actionLabel="새로고침"
          onAction={() => window.location.reload()}
        >
          <Button
            href="#/"
            onClick={() => {
              // 같은 주소(#/)로 이동해도 오류 상태가 풀리도록 새로고침해요
              window.setTimeout(() => window.location.reload(), 0)
            }}
            sx={{ minHeight: 44 }}
          >
            첫 화면으로
          </Button>
        </StatusMessage>
      </Box>
    </Container>
  )
}

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    reportClientError(error, { source: 'ErrorBoundary', componentStack: String(info?.componentStack ?? '').slice(0, 800) })
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (this.state.error) return <ErrorFallback error={this.state.error} />
    return this.props.children
  }
}

export default ErrorBoundary
