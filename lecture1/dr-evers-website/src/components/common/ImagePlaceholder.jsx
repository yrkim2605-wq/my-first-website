import { Box, Typography } from '@mui/material'

// 실제 사진이 들어오기 전까지 자리를 잡아 주는 상자예요.
// 사진이 생기면 이 컴포넌트를 <Box component="img" src=... /> 로 바꾸면 돼요.
const ImagePlaceholder = ({ label, sx }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #bfe9e5 0%, #6cc5bf 100%)',
        color: 'rgba(255, 255, 255, 0.9)',
        ...sx,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  )
}

export default ImagePlaceholder
