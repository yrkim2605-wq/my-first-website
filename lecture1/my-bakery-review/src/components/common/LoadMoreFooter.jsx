import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// 목록 아래의 "더 보기" 영역이에요 (버튼 방식).
//  - hasMore: 다음 쪽이 있으면 버튼, 없으면 "마지막 글이에요"
//  - loading: 불러오는 중에는 버튼을 잠가서 같은 쪽을 두 번 받지 않아요
//  - errorMessage: 실패해도 이미 보이는 글은 그대로 두고 아래에만 안내 + 다시 시도
//  - 모바일에서는 버튼이 가로 가득, 높이는 터치하기 편하게 최소 44px (터치 기기에서는 테마 규칙이 우선해요)
const LoadMoreFooter = ({ hasMore, loading = false, errorMessage = null, pageSize = 20, onLoadMore }) => (
  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
    {errorMessage && (
      <Alert severity="error" sx={{ width: '100%' }}>
        {errorMessage} (지금까지 보던 글은 그대로예요)
      </Alert>
    )}
    {hasMore ? (
      <Button variant="outlined" size="large" onClick={onLoadMore} disabled={loading} sx={{ minHeight: 48, width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 240 } }}>
        {loading ? '불러오는 중…' : errorMessage ? '다시 시도' : `더 보기 (${pageSize}개씩)`}
      </Button>
    ) : (
      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>마지막 글이에요</Typography>
    )}
  </Box>
)

export default LoadMoreFooter
