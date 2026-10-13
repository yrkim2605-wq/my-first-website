import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import WoodPanel from './WoodPanel'
import mascotLogo from '../../assets/logo-mascot-photo.webp'

// 오류가 났거나 결과가 없을 때 보여주는 안내 상자예요.
// actionLabel과 onAction을 넘기면 "다시 시도" 같은 버튼이 함께 나와요.
const StatusMessage = ({ title, description, actionLabel, onAction, sx }) => {
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
      <Box component="img" src={mascotLogo} alt="" sx={{ width: 56, height: 66, objectFit: 'contain', mb: 1 }} />
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
    </WoodPanel>
  )
}

export default StatusMessage
