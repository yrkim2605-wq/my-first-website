import { Box, Button, IconButton, TextField } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { ALLOWED_FILE_EXTENSIONS, validateFile } from '../../utils/validateFile'

// 파일 선택 칸: 선택한 파일 이름을 보여주고, 형식·크기가 맞지 않으면 안내 (데모라 서버로 보내지는 않음)
// value: { file, error } / onChange: 같은 모양의 값을 돌려줌
const FileField = ({ label, value, onChange }) => {
  const { file, error } = value

  const handleChange = (event) => {
    const picked = event.target.files[0]
    // 같은 파일을 다시 골라도 change가 일어나도록 비워 줌
    event.target.value = ''
    if (!picked) return
    const message = validateFile(picked)
    onChange(message ? { file: null, error: message } : { file: picked, error: '' })
  }

  const handleClear = () => onChange({ file: null, error: '' })

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={file?.name ?? ''}
        placeholder="선택된 파일 없음"
        error={Boolean(error)}
        helperText={error || ' '}
        slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
      />
      {file && (
        <IconButton aria-label={`${label} 선택 취소`} onClick={handleClear} sx={{ mt: 0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <Button
        component="label"
        variant="outlined"
        color="inherit"
        startIcon={<AttachFileIcon />}
        sx={{ flexShrink: 0, height: 40, borderColor: '#D5D8DD', '&:focus-within': { outline: '2px solid #f26a1b', outlineOffset: 2 } }}
      >
        선택
        <input
          hidden
          type="file"
          accept={ALLOWED_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
          onChange={handleChange}
        />
      </Button>
    </Box>
  )
}

export default FileField
