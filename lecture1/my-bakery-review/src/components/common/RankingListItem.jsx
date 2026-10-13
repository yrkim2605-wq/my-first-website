import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import RankingValue from './RankingValue'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 4위부터 보여주는 랭킹 목록의 한 줄
const RankingListItem = ({ rank, emoji, avatarImage, avatarScale, primaryText, secondaryText, levelBadge, valueText, valueKind }) => {
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        py: 1.5,
        px: { xs: 1.5, sm: 2.5 },
        borderBottom: '1px solid rgba(201,165,106,0.5)',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <Typography
        sx={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontSize: '0.95rem',
          width: 30,
          height: 30,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '8px',
          bgcolor: 'wood.main',
          color: 'gold.light',
        }}
      >
        {rank}
      </Typography>
      <Box
        sx={{
          width: 50,
          height: 50,
          // 메달이 있으면 동그랗게 자르지 않아요 (리본 · 왕관이 잘리지 않게)
          borderRadius: avatarImage ? 0 : RADIUS.round,
          bgcolor: avatarImage ? 'transparent' : 'butter.main',
          display: 'grid',
          placeItems: 'center',
          overflow: avatarImage ? 'visible' : 'hidden',
          flexShrink: 0,
        }}
      >
        {avatarImage ? (
          <Box component="img" src={avatarImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${avatarScale ?? 1})` }} />
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
                bgcolor: 'wood.main',
                color: 'gold.light',
                fontSize: '0.75rem',
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
