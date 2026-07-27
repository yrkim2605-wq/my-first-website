import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

const RankingListItem = ({ rank, emoji, avatarImage, primaryText, secondaryText, levelBadge, valueText, valueEmoji }) => {
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
        transition: 'background-color 0.15s ease',
        '&:hover': { bgcolor: 'rgba(46,42,37,0.03)' },
      }}
    >
      <Typography
        sx={{ fontSize: '1rem', fontWeight: 700, width: 28, textAlign: 'center', color: 'text.secondary' }}
      >
        #{rank}
      </Typography>
      {avatarImage ? (
        <Avatar variant="rounded" src={avatarImage} sx={{ width: 34, height: 32, borderRadius: '8px', flexShrink: 0 }}>
          {emoji}
        </Avatar>
      ) : (
        <Typography sx={{ fontSize: '1.4rem' }}>{emoji}</Typography>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
            {primaryText}
          </Typography>
          {levelBadge && (
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 999,
                bgcolor: '#F3D9A8',
                color: '#7A4A16',
                fontSize: '0.65rem',
                fontWeight: 800,
                flexShrink: 0,
                lineHeight: 1.4,
              }}
            >
              {levelBadge}
            </Box>
          )}
        </Box>
        {secondaryText && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {secondaryText}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'primary.main',
          flexShrink: 0,
          bgcolor: 'rgba(51,36,25,0.06)',
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
        }}
      >
        <Typography sx={{ fontSize: '0.95rem' }}>{valueEmoji}</Typography>
        <Typography sx={{ fontWeight: 800 }}>{valueText}</Typography>
      </Box>
    </Box>
  )
}

export default RankingListItem
