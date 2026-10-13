import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { RADIUS } from '../../theme'

// 다음 레벨까지의 진행 막대 (마이페이지 프로필 카드 안에서 써요)
// 막대는 방문 수 · 하트 수로 계산한 진행률(%)을 그대로 보여줘요. 새로 만든 점수가 아니에요.
const XpProgressBar = ({ levelName, nextLevelName, percent, visitsNeeded, heartsNeeded, isMaxLevel }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Box
            component="span"
            sx={{
              flexShrink: 0,
              px: 0.9,
              py: 0.1,
              borderRadius: RADIUS.pill,
              bgcolor: 'wood.main',
              color: 'gold.light',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              lineHeight: 1.6,
            }}
          >
            EXP
          </Box>
          <Box component="span">
            {levelName}
            {!isMaxLevel && (
              <Box component="span" sx={{ color: 'butter.contrastText', fontWeight: 500 }}>
                {' '}→ {nextLevelName}
              </Box>
            )}
          </Box>
        </Typography>
        <Typography sx={{ color: 'primary.main', fontWeight: 800, flexShrink: 0 }}>{percent}%</Typography>
      </Box>
      {/* 어두운 나무 홈 안에 금색 막대가 차오르는 모양 */}
      <Box
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="다음 레벨까지 진행률"
        sx={{
          height: 18,
          p: '2px',
          borderRadius: RADIUS.pill,
          bgcolor: 'wood.dark',
          border: '2px solid #2a1a0c',
          boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: `${percent}%`,
            minWidth: percent > 0 ? 10 : 0,
            height: '100%',
            borderRadius: RADIUS.pill,
            background: (theme) => `linear-gradient(180deg, ${theme.palette.gold.light}, ${theme.palette.gold.main} 55%, ${theme.palette.gold.dark})`,
            // 막대 윗면의 반짝임
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 2,
              left: 5,
              right: 5,
              height: 3,
              borderRadius: RADIUS.pill,
              bgcolor: 'rgba(255,255,255,0.55)',
            },
          }}
        />
      </Box>
      <Typography sx={{ display: 'block', mt: 0.75, fontSize: '0.8rem' }}>
        {isMaxLevel ? '최고 레벨 달성!' : `다음 레벨까지 방문 ${visitsNeeded}곳, 하트 ${heartsNeeded}개 필요`}
      </Typography>
    </Box>
  )
}

export default XpProgressBar
