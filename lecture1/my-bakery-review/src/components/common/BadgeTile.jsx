import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import LockIcon from '@mui/icons-material/Lock'
import WoodPanel from './WoodPanel'

const BadgeTile = ({ emoji, name, description, earned }) => {
  return (
    <Tooltip title={description} arrow>
      <WoodPanel
        variant="light"
        sx={{
          textAlign: 'center',
          position: 'relative',
          opacity: earned ? 1 : 0.35,
          filter: earned ? 'none' : 'grayscale(1)',
        }}
      >
        {!earned && (
          <LockIcon
            fontSize="small"
            sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}
          />
        )}
        <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{emoji}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mt: 0.5 }}>
          {name}
        </Typography>
      </WoodPanel>
    </Tooltip>
  )
}

export default BadgeTile
