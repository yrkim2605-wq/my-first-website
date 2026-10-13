import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import RankingValue from './RankingValue'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 1·2·3등 카드 색: 와인 · 세이지 · 테라코타 색 블록 (palette 이름)
const RANK_COLORS = {
  1: { bg: 'primary', text: 'primary.contrastText' },
  2: { bg: 'secondary', text: 'secondary.contrastText' },
  3: { bg: 'terracotta', text: 'terracotta.contrastText' },
}

const SIZES = {
  1: { width: 210, minHeight: 280, avatar: 104, name: '1.2rem', medal: 40 },
  2: { width: 170, minHeight: 236, avatar: 84, name: '1.02rem', medal: 34 },
  3: { width: 170, minHeight: 236, avatar: 84, name: '1.02rem', medal: 34 },
}

// 모바일에서는 1·2·3등 순서로 세로로 쌓고, 넓은 화면에서는 2·1·3 시상대 모양으로 놓아요.
const RANK_ORDER = { 1: { xs: 1, sm: 0 }, 2: { xs: 2, sm: 0 }, 3: { xs: 3, sm: 0 } }

const PodiumCard = ({ item }) => {
  const { palette } = useTheme()
  const color = RANK_COLORS[item.rank]
  const size = SIZES[item.rank]

  return (
    <Box
      sx={{
        order: RANK_ORDER[item.rank],
        position: 'relative',
        width: { xs: '100%', sm: size.width },
        maxWidth: { xs: 320, sm: size.width },
        mx: { xs: 'auto', sm: 0 },
        minHeight: { xs: 'auto', sm: size.minHeight },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        px: 2,
        pt: { xs: 3, sm: 4 },
        pb: 2.5,
        // 위쪽을 아치 모양으로
        borderRadius: { xs: RADIUS.lg, sm: '999px 999px 18px 18px' },
        bgcolor: `${color.bg}.main`,
        color: color.text,
      }}
    >
      <Box
        aria-label={`${item.rank}위`}
        sx={{
          width: size.medal,
          height: size.medal,
          borderRadius: RADIUS.round,
          bgcolor: 'mustard.main',
          color: 'mustard.contrastText',
          display: 'grid',
          placeItems: 'center',
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontSize: item.rank === 1 ? '1.2rem' : '1rem',
          mb: 1.5,
          boxShadow: `0 0 0 3px ${palette[color.bg].main}, 0 0 0 5px rgba(251,246,234,0.5)`,
        }}
      >
        {item.rank}
      </Box>
      <Box
        sx={{
          width: size.avatar,
          height: size.avatar,
          // 메달이 있으면 동그랗게 자르지 않아요 (리본 · 왕관이 잘리지 않게)
          borderRadius: item.avatarImage ? 0 : RADIUS.round,
          bgcolor: item.avatarImage ? 'transparent' : 'background.paper',
          display: 'grid',
          placeItems: 'center',
          overflow: item.avatarImage ? 'visible' : 'hidden',
          mb: 1.25,
        }}
      >
        {item.avatarImage ? (
          <Box component="img" src={item.avatarImage} alt="" sx={{ width: '100%', height: '100%', objectFit: 'contain', transform: `scale(${item.avatarScale ?? 1})` }} />
        ) : (
          <Typography sx={{ fontSize: '2rem' }}>{item.emoji}</Typography>
        )}
      </Box>
      <Typography sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: size.name, maxWidth: '100%' }} noWrap>
        {item.primaryText}
      </Typography>
      {item.levelBadge && (
        <Box
          sx={{
            mt: 0.5,
            px: 1,
            py: 0.2,
            borderRadius: RADIUS.pill,
            bgcolor: 'butter.main',
            color: 'butter.contrastText',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}
        >
          {item.levelBadge}
        </Box>
      )}
      {item.secondaryText && (
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.85, mt: 0.25, maxWidth: '100%' }} noWrap>
          {item.secondaryText}
        </Typography>
      )}
      <RankingValue kind={item.valueKind} value={item.valueText} size={item.rank === 1 ? 'lg' : 'md'} sx={{ mt: 'auto', pt: 1.5 }} />
    </Box>
  )
}

const RankingPodium = ({ items }) => {
  const [first, second, third] = items

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        justifyContent: 'center',
        gap: { xs: 1.5, sm: 2.5 },
        mb: 4,
      }}
    >
      {second && <PodiumCard item={second} />}
      {first && <PodiumCard item={first} />}
      {third && <PodiumCard item={third} />}
    </Box>
  )
}

export default RankingPodium
