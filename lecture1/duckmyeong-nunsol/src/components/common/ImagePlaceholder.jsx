import { Box } from '@mui/material'
import ImageIcon from '@mui/icons-material/ImageOutlined'

// 이미지 자리를 회색 박스로 표시하는 공통 컴포넌트
const ImagePlaceholder = ({ label = '이미지', sx }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        bgcolor: '#E5E7EB',
        color: '#9CA3AF',
        width: '100%',
        ...sx,
      }}
    >
      <ImageIcon />
      {label && (
        <Box component="span" sx={{ fontSize: '0.75rem' }}>
          {label}
        </Box>
      )}
    </Box>
  )
}

export default ImagePlaceholder
