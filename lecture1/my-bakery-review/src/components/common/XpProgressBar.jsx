import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

const XpProgressBar = ({
  levelEmoji,
  levelName,
  nextLevelName,
  percent,
  visitsNeeded,
  heartsNeeded,
  isMaxLevel,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {levelEmoji} {levelName}
          {!isMaxLevel && ` → ${nextLevelName}`}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'primary.main', fontWeight: 700 }}
        >
          {percent}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {isMaxLevel
          ? '최고 레벨 달성!'
          : `다음 레벨까지 방문 ${visitsNeeded}곳, 하트 ${heartsNeeded}개 필요`}
      </Typography>
    </Box>
  )
}

export default XpProgressBar
