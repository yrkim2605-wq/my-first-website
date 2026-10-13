import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

// 배지 한 칸: 위쪽이 둥근 아치 모양. 받은 배지는 버터색, 아직 못 받은 배지는 점선 테두리 + 흑백
// progressText: 아직 못 받은 배지의 진행도 (예: "2/10")
const BadgeTile = ({ emoji, iconImage, name, description, earned, progressText }) => {
  return (
    <Tooltip title={description} arrow>
      <Box
        tabIndex={0}
        aria-label={`${name}${earned ? '' : ' (아직 못 받았어요)'}: ${description}`}
        sx={{
          position: 'relative',
          textAlign: 'center',
          px: 1.5,
          pt: 3,
          pb: 2,
          borderRadius: '999px 999px 16px 16px',
          ...(earned
            ? { bgcolor: 'butter.main', border: '2px solid', borderColor: 'gold.main', boxShadow: '0 2px 0 rgba(107,68,35,0.25)' }
            : { bgcolor: 'rgba(255,255,255,0.35)', border: '2px dashed rgba(201,165,106,0.9)' }),
        }}
      >
        {!earned && (
          <LockOutlinedIcon sx={{ position: 'absolute', top: 12, right: 14, fontSize: '1rem', color: 'text.secondary' }} />
        )}
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'grid',
            placeItems: 'center',
            mb: 1,
            filter: earned ? 'none' : 'grayscale(1)',
            opacity: earned ? 1 : 0.55,
          }}
        >
          {iconImage ? (
            <Box component="img" src={iconImage} alt="" sx={{ width: 44, height: 44, objectFit: 'contain' }} />
          ) : (
            <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{emoji}</Typography>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: earned ? 'butter.contrastText' : 'text.secondary',
          }}
        >
          {name}
        </Typography>
        {progressText && (
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mt: 0.25 }}>{progressText}</Typography>
        )}
      </Box>
    </Tooltip>
  )
}

export default BadgeTile
