import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WavyDivider from './decor/WavyDivider'

// 홈 섹션 제목: 작은 영문 라벨 → 세리프 제목 → 물결 선 → 한 줄 설명 (가운데 정렬)
// tone="onColor"는 색 블록 위에 올릴 때 써요.
const SectionHeading = ({ eyebrow, title, description, tone = 'default', sx }) => {
  const onColor = tone === 'onColor'

  return (
    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', ...sx }}>
      {eyebrow && (
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: onColor ? 'primary.contrastText' : 'terracotta.main',
            mb: 1,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: '1.7rem', sm: '2.1rem' },
          color: onColor ? 'primary.contrastText' : 'primary.main',
        }}
      >
        {title}
      </Typography>
      <WavyDivider sx={{ my: 1.5 }} />
      {description && (
        <Typography
          sx={{
            fontSize: '0.95rem',
            color: onColor ? 'primary.contrastText' : 'text.secondary',
            opacity: onColor ? 0.85 : 1,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  )
}

export default SectionHeading
