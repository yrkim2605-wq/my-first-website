import { Box } from '@mui/material'

// 실제 사진이 들어오기 전까지 자리를 잡아 주는 회색 상자예요.
// 사진이 생기면 이 컴포넌트를 <Box component="img" src=... /> 로 바꾸면 돼요.
const ImagePlaceholder = ({ sx }) => {
  return <Box sx={{ bgcolor: '#d9dde1', ...sx }} />
}

export default ImagePlaceholder
