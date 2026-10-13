import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { RADIUS } from '../../theme'

// 다음 레벨까지의 진행 막대 (마이페이지 프로필 카드 안에서 써요)
const XpProgressBar = ({ levelName, nextLevelName, percent, visitsNeeded, heartsNeeded, isMaxLevel }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
          {levelName}
          {!isMaxLevel && (
            <Box component="span" sx={{ color: 'butter.contrastText', fontWeight: 500 }}>
              {' '}→ {nextLevelName}
            </Box>
          )}
        </Typography>
        <Typography sx={{ color: 'primary.main', fontWeight: 800 }}>{percent}%</Typography>
      </Box>
      <Box
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="다음 레벨까지 진행률"
        sx={{ height: 10, borderRadius: RADIUS.pill, bgcolor: 'background.paper', overflow: 'hidden' }}
      >
        <Box sx={{ width: `${percent}%`, height: '100%', borderRadius: RADIUS.pill, bgcolor: 'primary.main' }} />
      </Box>
      <Typography sx={{ display: 'block', mt: 0.75, fontSize: '0.8rem' }}>
        {isMaxLevel ? '최고 레벨 달성!' : `다음 레벨까지 방문 ${visitsNeeded}곳, 하트 ${heartsNeeded}개 필요`}
      </Typography>
    </Box>
  )
}

export default XpProgressBar
