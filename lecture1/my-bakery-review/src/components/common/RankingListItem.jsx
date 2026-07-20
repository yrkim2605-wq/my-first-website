import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

const RankingListItem = ({ rank, emoji, primaryText, secondaryText, valueText, valueEmoji }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1,
        px: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        sx={{ fontSize: MEDALS[rank] ? '1.3rem' : '1.1rem', fontWeight: 700, width: 32, textAlign: 'center', color: 'primary.main' }}
      >
        {MEDALS[rank] || `#${rank}`}
      </Typography>
      <Typography sx={{ fontSize: '1.4rem' }}>{emoji}</Typography>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
          {primaryText}
        </Typography>
        {secondaryText && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {secondaryText}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', flexShrink: 0 }}>
        <Typography variant="body2">{valueEmoji}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {valueText}
        </Typography>
      </Box>
    </Box>
  )
}

export default RankingListItem
