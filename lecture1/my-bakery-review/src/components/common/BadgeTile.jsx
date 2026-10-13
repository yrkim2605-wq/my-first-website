import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'

// 배지 한 칸: 위쪽이 둥근 아치 모양. 받은 배지는 버터색, 아직 못 받은 배지는 점선 테두리 + 흑백
const BadgeTile = ({ emoji, iconImage, name, description, earned }) => {
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
            ? { bgcolor: 'butter.main', border: '1px solid transparent' }
            : { bgcolor: 'transparent', border: '1px dashed rgba(59,42,34,0.25)' }),
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
      </Box>
    </Tooltip>
  )
}

export default BadgeTile
