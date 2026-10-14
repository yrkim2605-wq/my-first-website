import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// 글을 지웠거나 사진을 바꿨는데 서버에서 옛 사진 파일을 지우지 못했을 때, 남은 파일을 알려주는 안내예요.
// 남은 파일은 이 브라우저에 기록돼 있고, [다시 정리하기]로 다시 지워 볼 수 있어요.
// 계속 남으면 Supabase 대시보드 → Storage → photos → 내 사용자 ID 폴더에서 아래 파일 이름을 찾아 직접 지울 수 있어요.
const LeftoverPhotosNotice = ({ items, busy = false, onRetry, sx }) => {
  if (!items || items.length === 0) return null
  return (
    <Alert severity="warning" sx={sx} action={<Button color="inherit" size="small" onClick={onRetry} disabled={busy} sx={{ minHeight: 44 }}>{busy ? '정리 중…' : '다시 정리하기'}</Button>}>
      글은 지웠지만 <b>사진 파일 {items.length}개를 서버에서 지우지 못했어요.</b>
      <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.25, fontSize: '0.78rem', wordBreak: 'break-all' }}>
        {items.map((item) => (
          <li key={item.path}>{item.path}</li>
        ))}
      </Box>
    </Alert>
  )
}

export default LeftoverPhotosNotice
