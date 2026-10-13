import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WavyDivider from './decor/WavyDivider'
import Reveal from './Reveal'

// 홈 섹션 제목: 작은 영문 라벨 → 세리프 제목 → 물결 선 → 한 줄 설명 (가운데 정렬)
// tone="onColor"는 색 블록 위에 올릴 때 써요.
// variant="sign"은 제목을 나무 간판 위에 올려요 (RPG 컨셉). 물결 선 대신 간판이 구분선 역할을 해요.
// titleId를 주면 제목에 id가 붙어서, 섹션의 aria-labelledby로 연결할 수 있어요.
const SectionHeading = ({ eyebrow, title, titleId, description, tone = 'default', variant = 'plain', sx }) => {
  const onColor = tone === 'onColor'
  const isSign = variant === 'sign'

  const titleNode = (
    <Typography
      id={titleId}
      variant="h2"
      sx={{
        fontSize: { xs: '1.7rem', sm: '2.1rem' },
        color: isSign ? 'wood.contrastText' : onColor ? 'primary.contrastText' : 'primary.main',
      }}
    >
      {title}
    </Typography>
  )

  return (
    <Reveal distance={14}>
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
      {isSign ? (
        <Box className="wood-panel wood-sign" sx={{ px: { xs: 4.5, sm: 6 }, py: { xs: 1, sm: 1.25 }, maxWidth: '100%' }}>
          {titleNode}
        </Box>
      ) : (
        <>
          {titleNode}
          <WavyDivider sx={{ my: 1.5 }} />
        </>
      )}
      {description && (
        <Typography
          sx={{
            fontSize: '0.95rem',
            color: onColor ? 'primary.contrastText' : 'text.secondary',
            opacity: onColor ? 0.85 : 1,
            mt: isSign ? 1.5 : 0,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
    </Reveal>
  )
}

export default SectionHeading
