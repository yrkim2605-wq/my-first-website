import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

// 글을 저장하려는데 사진 올리기만 실패했을 때의 안내예요.
// 쓰던 글(제목 · 본문 · 카테고리)과 고른 사진은 화면에 그대로 남아 있고, 아래 둘 중에서 고를 수 있어요.
//  - 다시 시도: 같은 글 + 같은 사진으로 다시 올려요
//  - 사진 없이 글만 저장 (고치기에서는 "사진은 그대로 두고 글만 고치기"): 새로 고른 사진은 버리고 글만 저장해요
const PhotoUploadFailedNotice = ({ message, mode = 'write', busy = false, onRetry, onSkipPhoto }) => (
  <Alert severity="warning">
    {message}
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
      <Button size="small" variant="contained" onClick={onRetry} disabled={busy} sx={{ minHeight: 44 }}>
        다시 시도
      </Button>
      <Button size="small" variant="outlined" color="inherit" onClick={onSkipPhoto} disabled={busy} sx={{ minHeight: 44 }}>
        {mode === 'edit' ? '사진은 그대로 두고 글만 고치기' : '사진 없이 글만 저장'}
      </Button>
    </Box>
  </Alert>
)

export default PhotoUploadFailedNotice
