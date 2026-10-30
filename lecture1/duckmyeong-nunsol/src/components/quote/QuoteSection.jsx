import { useId } from 'react'
import { Box, Typography } from '@mui/material'

// 견적 페이지의 번호가 붙은 구획 (1. 제품 검색 / 2. 제품 관리 / 3. 요청 정보)
const QuoteSection = ({ id, step, title, hint, children }) => {
  const titleId = useId()

  return (
    <Box component="section" id={id} aria-labelledby={titleId} sx={{ mb: { xs: 5, md: 6 }, scrollMarginTop: 16 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          columnGap: 1.5,
          pb: 1.5,
          mb: 2.5,
          borderBottom: '2px solid',
          borderColor: 'secondary.main',
        }}
      >
        <Typography id={titleId} variant="h3" component="h2">
          <Box component="span" sx={{ color: 'primary.main', mr: 0.75 }}>
            {step}.
          </Box>
          {title}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>
            {hint}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  )
}

export default QuoteSection
