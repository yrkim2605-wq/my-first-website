import { useId } from 'react'
import { Box, Paper, Typography } from '@mui/material'

// 견적 페이지의 흰 카드 한 장 (번호 배지 + 제목 + 오른쪽 보조 문구)
const QuoteSection = ({ id, step, title, hint, children }) => {
  const titleId = useId()

  return (
    <Paper
      component="section"
      id={id}
      aria-labelledby={titleId}
      variant="outlined"
      sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 1.5, borderColor: '#E8EAED', scrollMarginTop: 16 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 700,
          }}
        >
          {step}
        </Box>
        <Typography id={titleId} variant="h3" component="h2" sx={{ fontSize: '1.125rem' }}>
          {title}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', textAlign: 'right' }}>
            {hint}
          </Typography>
        )}
      </Box>
      {children}
    </Paper>
  )
}

export default QuoteSection
