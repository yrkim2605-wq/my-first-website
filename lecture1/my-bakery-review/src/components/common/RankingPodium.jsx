import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

const RANK_STYLES = {
  1: {
    medalFill: '#F5C242',
    medalFillLight: '#FFF3D6',
    medalRibbon: '#D99A2B',
    background: 'linear-gradient(160deg, #FFF6E6 0%, #F3D9A8 100%)',
    border: '#E3B873',
    shadow: '0 12px 26px rgba(227,184,115,0.45)',
    scoreColor: '#7A4A16',
  },
  2: {
    medalFill: '#C7CFD6',
    medalFillLight: '#F1F4F6',
    medalRibbon: '#9AA5AD',
    background: 'linear-gradient(160deg, #F7F7F5 0%, #DAD5CB 100%)',
    border: '#B9B4A8',
    shadow: '0 8px 18px rgba(70,60,50,0.14)',
    scoreColor: '#4F4A42',
  },
  3: {
    medalFill: '#CD7F45',
    medalFillLight: '#F0D2B0',
    medalRibbon: '#A85C2A',
    background: 'linear-gradient(160deg, #F3E4D6 0%, #D8AC85 100%)',
    border: '#C08A57',
    shadow: '0 8px 18px rgba(160,110,60,0.22)',
    scoreColor: '#7A4116',
  },
}

const MEDAL_OUTLINE = '#5C4433'

const Medal = ({ rank, size }) => {
  const style = RANK_STYLES[rank]
  return (
    <Box component="svg" viewBox="0 0 44 52" sx={{ width: size, height: size * (52 / 44) }}>
      <path
        d="M12,20 L4,4 L16,4 L22,16 Z"
        fill={style.medalRibbon}
        stroke={MEDAL_OUTLINE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M32,20 L40,4 L28,4 L22,16 Z"
        fill={style.medalRibbon}
        stroke={MEDAL_OUTLINE}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="30" r="16" fill={style.medalFill} stroke={MEDAL_OUTLINE} strokeWidth="2.5" />
      <circle cx="22" cy="30" r="11" fill="none" stroke={style.medalFillLight} strokeWidth="1.5" opacity="0.8" />
      <text
        x="22"
        y="35"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill={MEDAL_OUTLINE}
        fontFamily="inherit"
      >
        {rank}
      </text>
    </Box>
  )
}

const SIZES = {
  1: { width: 200, minHeight: 260, medalPx: 42, emojiSize: '3rem', avatarSize: 56, nameSize: '1.15rem', scoreSize: '1.5rem' },
  2: { width: 160, minHeight: 220, medalPx: 34, emojiSize: '2.4rem', avatarSize: 46, nameSize: '1rem', scoreSize: '1.2rem' },
  3: { width: 160, minHeight: 220, medalPx: 34, emojiSize: '2.4rem', avatarSize: 46, nameSize: '1rem', scoreSize: '1.2rem' },
}

const RANK_ORDER = { 1: { xs: 1, sm: 0 }, 2: { xs: 2, sm: 0 }, 3: { xs: 3, sm: 0 } }

const PodiumCard = ({ item }) => {
  const style = RANK_STYLES[item.rank]
  const size = SIZES[item.rank]

  return (
    <Box
      sx={{
        order: RANK_ORDER[item.rank],
        width: { xs: '100%', sm: size.width },
        maxWidth: { xs: 300, sm: size.width },
        flex: { xs: '0 1 auto', sm: `0 1 ${size.width}px` },
        minHeight: { xs: 'auto', sm: size.minHeight },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        p: item.rank === 1 ? 3 : 2.5,
        borderRadius: 3,
        background: style.background,
        border: `1px solid ${style.border}`,
        boxShadow: style.shadow,
        transform: item.rank === 1 ? { xs: 'none', sm: 'translateY(-16px)' } : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: item.rank === 1 ? { xs: 'translateY(-4px)', sm: 'translateY(-20px)' } : 'translateY(-4px)',
        },
      }}
    >
      <Box sx={{ mb: 0.5 }}>
        <Medal rank={item.rank} size={size.medalPx} />
      </Box>
      {item.avatarImage ? (
        <Avatar
          variant="rounded"
          src={item.avatarImage}
          sx={{ width: size.avatarSize, height: size.avatarSize, borderRadius: '12px', mb: 1 }}
        >
          {item.emoji}
        </Avatar>
      ) : (
        <Typography sx={{ fontSize: size.emojiSize, lineHeight: 1, mb: 1 }}>{item.emoji}</Typography>
      )}
      <Typography sx={{ fontWeight: 700, fontSize: size.nameSize, mb: 0.25 }} noWrap>
        {item.primaryText}
      </Typography>
      {item.levelBadge && (
        <Box
          sx={{
            px: 1,
            py: 0.2,
            mb: 1.5,
            borderRadius: 999,
            bgcolor: '#F3D9A8',
            color: '#7A4A16',
            fontSize: '0.7rem',
            fontWeight: 800,
            maxWidth: '100%',
          }}
        >
          {item.levelBadge}
        </Box>
      )}
      {item.secondaryText && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ mb: 1.5, maxWidth: '100%' }}>
          {item.secondaryText}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: style.scoreColor, mt: 'auto' }}>
        <Typography sx={{ fontSize: '1.1rem' }}>{item.valueEmoji}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: size.scoreSize }}>{item.valueText}</Typography>
      </Box>
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
        gap: { xs: 1.5, sm: 3 },
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
