import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import RankingValue from './RankingValue'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 4위부터 보여주는 랭킹 목록의 한 줄
const RankingListItem = ({ rank, emoji, avatarImage, primaryText, secondaryText, levelBadge, valueText, valueKind }) => {
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        py: 1.5,
        px: { xs: 1.5, sm: 2.5 },
        borderBottom: '1px solid rgba(59,42,34,0.08)',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography
        sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: '1.05rem', width: 24, textAlign: 'center', color: 'terracotta.main' }}
      >
        {rank}
      </Typography>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: RADIUS.round,
          bgcolor: 'butter.main',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {avatarImage ? (
          <Box component="img" src={avatarImage} alt="" sx={{ width: '86%', height: '86%', objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: '1.2rem' }}>{emoji}</Typography>
        )}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {primaryText}
          </Typography>
          {levelBadge && (
            <Box
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: RADIUS.pill,
                bgcolor: 'butter.main',
                color: 'butter.contrastText',
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {levelBadge}
            </Box>
          )}
        </Box>
        {secondaryText && (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }} noWrap>
            {secondaryText}
          </Typography>
        )}
      </Box>
      <RankingValue kind={valueKind} value={valueText} sx={{ color: 'primary.main', flexShrink: 0 }} />
    </Box>
  )
}

export default RankingListItem
