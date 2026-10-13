import { useState } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

// 비밀번호 입력칸 (눈 모양 버튼으로 보이기/숨기기). 입력값은 화면 상태에만 있고 어디에도 저장하지 않아요.
const PasswordField = ({ autoComplete, ...props }) => {
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      fullWidth
      size="small"
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
                sx={{ width: 40, height: 40 }}
              >
                {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

export default PasswordField
