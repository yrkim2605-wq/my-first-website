import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import WavyDivider from './decor/WavyDivider'
import Reveal from './Reveal'
import { PARCHMENT_SX } from '../../constants/rpgStyles'

// 섹션 제목. 가운데 정렬이고 variant에 따라 제목을 놓는 "물건"이 달라져요 (RPG 컨셉).
//   plain   : 작은 영문 라벨 → 세리프 제목 → 물결 선 → 설명 (기본)
//   sign    : 나무 간판 위에 제목 (물결 선 대신 간판이 구분선 역할)
//   ribbon  : 버건디 리본 배너 (지도 · 이동 느낌)
//   board   : 퀘스트 보드에 압정으로 꽂은 양피지 메모
//   journal : 손글씨 일지 제목 + 형광펜 밑줄
// tone="onColor"는 색 블록(세이지 · 와인) 위에 올릴 때 써요. titleId를 주면 aria-labelledby에 연결할 수 있어요.
const SectionHeading = ({ eyebrow, title, titleId, description, tone = 'default', variant = 'plain', sx }) => {
  const onColor = tone === 'onColor'

  const titleSx = {
    plain: { color: onColor ? 'primary.contrastText' : 'primary.main' },
    sign: { color: 'wood.contrastText' },
    ribbon: { color: 'primary.contrastText', letterSpacing: '0.02em' },
    board: { color: 'primary.main' },
    journal: {
      fontFamily: '"Gaegu", cursive',
      fontWeight: 700,
      fontSize: { xs: '2.1rem', sm: '2.7rem' },
      lineHeight: 1.15,
      color: onColor ? 'primary.contrastText' : 'wood.main',
      // 형광펜으로 그은 듯한 밑줄
      backgroundImage: 'linear-gradient(transparent 62%, rgba(226,176,74,0.55) 62%)',
      px: 0.75,
    },
  }[variant]

  const titleNode = (
    <Typography id={titleId} variant="h2" sx={{ fontSize: { xs: '1.7rem', sm: '2.1rem' }, ...titleSx }}>
      {title}
    </Typography>
  )

  // 제목을 감싸는 물건
  const wrapped = {
    plain: (
      <>
        {titleNode}
        <WavyDivider sx={{ my: 1.5 }} />
      </>
    ),
    sign: (
      <Box className="wood-panel wood-sign" sx={{ px: { xs: 4.5, sm: 6 }, py: { xs: 1, sm: 1.25 }, maxWidth: '100%' }}>
        {titleNode}
      </Box>
    ),
    ribbon: (
      <Box
        sx={{
          position: 'relative',
          maxWidth: '100%',
          // 리본 꼬리: 양 끝이 제비꼬리처럼 파인 모양 + 아래로 떨어지는 그림자
          filter: 'drop-shadow(0 3px 0 rgba(90,31,42,0.55))',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            bgcolor: 'primary.main',
            px: { xs: 6, sm: 8 },
            py: { xs: 1, sm: 1.2 },
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 18px) 50%, 100% 100%, 0 100%, 18px 50%)',
            // 안쪽의 금색 박음질
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '5px 24px',
              borderTop: '2px dashed rgba(226,176,74,0.8)',
              borderBottom: '2px dashed rgba(226,176,74,0.8)',
              pointerEvents: 'none',
            },
          }}
        >
          {titleNode}
        </Box>
      </Box>
    ),
    board: (
      <Box
        sx={{
          position: 'relative',
          ...PARCHMENT_SX,
          borderRadius: '14px',
          px: { xs: 3.5, sm: 5 },
          py: { xs: 1.1, sm: 1.4 },
          maxWidth: '100%',
          transform: 'rotate(-1.2deg)',
          // 압정
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -8,
            left: '50%',
            width: 15,
            height: 15,
            ml: '-7px',
            borderRadius: '50%',
            backgroundColor: '#d9735e',
            border: '2px solid #3e2713',
            boxShadow: '0 2px 0 rgba(33,20,10,0.4)',
          },
        }}
      >
        {titleNode}
      </Box>
    ),
    journal: <Box sx={{ maxWidth: '100%' }}>{titleNode}</Box>,
  }[variant]

  const hasDivider = variant === 'plain'

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
              mb: variant === 'board' || variant === 'ribbon' ? 1.5 : 1,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        {wrapped}
        {description && (
          <Typography
            sx={{
              fontSize: '0.95rem',
              color: onColor ? 'primary.contrastText' : 'text.secondary',
              opacity: onColor ? 0.85 : 1,
              mt: hasDivider ? 0 : 1.5,
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
