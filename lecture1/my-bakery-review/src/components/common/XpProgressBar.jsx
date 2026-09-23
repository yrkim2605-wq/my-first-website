import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'

const XpProgressBar = ({
  levelEmoji,
  levelIconImage,
  levelName,
  nextLevelName,
  percent,
  visitsNeeded,
  heartsNeeded,
  isMaxLevel,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 700 }}>
          {levelIconImage ? (
            <Box
              component="img"
              src={levelIconImage}
              alt=""
              sx={{ width: 32, height: 28, objectFit: 'cover', borderRadius: '8px' }}
            />
          ) : (
            <span>{levelEmoji}</span>
          )}
          {levelName}
          {!isMaxLevel && ` → ${nextLevelName}`}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'primary.main', fontWeight: 700 }}
        >
          {percent}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          '& .MuiLinearProgress-bar': {
            backgroundImage: 'linear-gradient(90deg, #5C4433 0%, #E3B873 65%, #F6DFA8 100%)',
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {isMaxLevel
          ? '최고 레벨 달성!'
          : `다음 레벨까지 방문 ${visitsNeeded}곳, 하트 ${heartsNeeded}개 필요`}
      </Typography>
    </Box>
  )
}

export default XpProgressBar
