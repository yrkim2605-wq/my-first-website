import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import XpTrack from './XpTrack'
import { RADIUS } from '../../theme'

// 다음 레벨까지의 진행 막대 (마이페이지 프로필 카드 안에서 써요)
// 막대는 저장된 리뷰로 계산한 누적 EXP의 현재 레벨 구간 진행률(%)을 그대로 보여줘요.
const XpProgressBar = ({ levelName, nextLevelName, percent, exp, expToNext, isMaxLevel }) => {
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
      <XpTrack
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="다음 레벨까지 진행률"
        percent={percent}
      />
      <Typography sx={{ display: 'block', mt: 0.75, fontSize: '0.8rem' }}>
        {isMaxLevel ? `최고 레벨 달성! (누적 EXP ${exp})` : `누적 EXP ${exp} · 다음 레벨까지 EXP ${expToNext} 필요`}
      </Typography>
    </Box>
  )
}

export default XpProgressBar
