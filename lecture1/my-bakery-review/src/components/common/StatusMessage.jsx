import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import WoodPanel from './WoodPanel'
import Sticker from './decor/Sticker'
import Sparkle from './decor/Sparkle'
import mascotLogo from '../../assets/logo-mascot-photo.webp'

// 상황(mood)마다 빵 기사가 다른 모습으로 나와요.
//  loading : 배낭을 메고 걸어가는 모습   error   : 땀을 흘리며 당황한 모습
//  empty   : 빵 침대에서 빼꼼          notfound: 돋보기로 찾는 모습
//  (mood를 안 정하면 예전처럼 로고 마스코트가 나와요)
const MOODS = {
  loading: { sticker: 'knight-pack', width: 104, float: true },
  error: { sticker: 'knight-sweat', width: 108 },
  empty: { sticker: 'knight-breadbed', width: 128 },
  notfound: { sticker: 'knight-search', width: 108 },
}

// 오류가 났거나 결과가 없을 때 보여주는 안내 상자예요.
// actionLabel과 onAction을 넘기면 "다시 시도" 같은 버튼이 함께 나와요.
// sparkles를 켜면 상자 양옆 구석에 작은 금빛 별 몇 개를 달아요. children은 맨 아래(버튼 자리)에 그대로 들어가요.
const StatusMessage = ({ title, description, actionLabel, onAction, mood, sparkles = false, children, sx }) => {
  const moodStyle = MOODS[mood]
  return (
    <WoodPanel
      variant="light"
      role="status"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        py: { xs: 4, sm: 5 },
        px: 3,
        ...sx,
      }}
    >
      {sparkles && (
        <>
          <Sparkle size={18} twinkle sx={{ position: 'absolute', top: 22, left: { xs: 16, sm: '22%' } }} />
          <Sparkle size={12} twinkle delay={1} sx={{ position: 'absolute', top: 50, left: { xs: 40, sm: 'calc(22% + 26px)' } }} />
          <Sparkle size={14} twinkle delay={1.8} sx={{ position: 'absolute', top: 30, right: { xs: 18, sm: '22%' } }} />
        </>
      )}
      {moodStyle ? (
        <Sticker name={moodStyle.sticker} width={moodStyle.width} float={moodStyle.float} sx={{ mb: 0.5 }} />
      ) : (
        <Box component="img" src={mascotLogo} alt="" sx={{ width: 56, height: 66, objectFit: 'contain', mb: 1 }} />
      )}
      <Typography variant="h3">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1.5 }}>
          {actionLabel}
        </Button>
      )}
      {children}
    </WoodPanel>
  )
}

export default StatusMessage
