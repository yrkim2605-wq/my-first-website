import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { DISPLAY_FONT } from '../../theme'

// 글쓰기 · 글 고치기의 사진 칸이에요 (글 1개에 사진 1장, 선택 사항).
//  - previewUrl이 있으면 미리보기 + [사진 바꾸기] [사진 빼기], 없으면 [사진 붙이기]
//  - 고른 사진은 올리기 전에 JPEG 800px로 줄여요 (1MB 이하, 서버 저장소 정책)
//  - 이 컴포넌트는 서버와 통신하지 않아요: 고른 파일을 onPick으로 넘기고, 어떻게 처리할지는 부모가 정해요.
const PostPhotoPicker = ({ previewUrl, busy = false, disabled = false, errorMessage = null, onPick, onRemove }) => {
  const handleChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // 같은 사진을 다시 골라도 반응하도록 비워요
    if (file) onPick(file)
  }
  return (
    <Box component="fieldset" sx={{ border: 'none', p: 0, m: 0, minWidth: 0 }}>
      <Typography component="legend" sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1rem', mb: 1 }}>
        사진 <Box component="span" sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary' }}>(선택 · 1장)</Box>
      </Typography>

      {previewUrl && (
        <Box
          component="img"
          src={previewUrl}
          alt="붙인 사진 미리보기"
          sx={{ display: 'block', width: '100%', maxWidth: 320, height: { xs: 190, sm: 220 }, objectFit: 'cover', borderRadius: '999px 999px 14px 14px', border: '3px solid #c9a56a', boxShadow: '0 3px 0 rgba(107,68,35,0.25)', mb: 1.5 }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button component="label" variant="outlined" startIcon={<AddAPhotoIcon />} disabled={busy || disabled} sx={{ minHeight: 44 }}>
          {busy ? '사진 준비 중…' : previewUrl ? '사진 바꾸기' : '사진 붙이기'}
          <input type="file" accept="image/*" hidden onChange={handleChange} />
        </Button>
        {previewUrl && (
          <Button color="inherit" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={onRemove} disabled={busy || disabled} sx={{ minHeight: 44 }}>
            사진 빼기
          </Button>
        )}
      </Box>

      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.75, wordBreak: 'keep-all' }}>
        올릴 때 자동으로 800px로 줄여요 (JPEG · WebP, 1MB 이하). 사진은 모두에게 공개돼요.
      </Typography>
      {errorMessage && (
        <Typography role="alert" sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'error.dark', mt: 0.75, wordBreak: 'keep-all' }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  )
}

export default PostPhotoPicker
