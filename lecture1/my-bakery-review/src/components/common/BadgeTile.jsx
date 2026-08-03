import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import LockIcon from '@mui/icons-material/Lock'
import WoodPanel from './WoodPanel'
import { HOVER_LIFT_TRANSITION } from '../../constants/motion'

const BadgeTile = ({ emoji, iconImage, name, description, earned }) => {
  return (
    <Tooltip title={description} arrow>
      <WoodPanel
        variant="light"
        sx={{
          textAlign: 'center',
          position: 'relative',
          transition: HOVER_LIFT_TRANSITION,
          ...(earned
            ? {
                background: 'linear-gradient(160deg, #FFF6E6 0%, #F3D9A8 100%)',
                border: '1px solid #E3B873',
                boxShadow: '0 4px 14px rgba(227,184,115,0.4)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 20px rgba(227,184,115,0.5)',
                },
              }
            : {
                bgcolor: '#EDEAE3',
                border: '1px solid rgba(46,42,37,0.08)',
                opacity: 0.6,
              }),
        }}
      >
        {!earned && (
          <LockIcon
            fontSize="small"
            sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}
          />
        )}
        {iconImage ? (
          <Box
            component="img"
            src={iconImage}
            alt=""
            sx={{
              width: 48,
              height: 48,
              mx: 'auto',
              objectFit: 'contain',
              filter: earned ? 'none' : 'grayscale(1)',
            }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: '2rem',
              lineHeight: 1,
              filter: earned ? 'none' : 'grayscale(1)',
            }}
          >
            {emoji}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            display: 'block',
            mt: 0.5,
            color: earned ? '#7A4A16' : 'text.secondary',
          }}
        >
          {name}
        </Typography>
      </WoodPanel>
    </Tooltip>
  )
}

export default BadgeTile
