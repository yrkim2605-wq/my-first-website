import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router-dom'
import RankingValue from './RankingValue'
import { PARCHMENT_SX } from '../../constants/rpgStyles'
import { DISPLAY_FONT, RADIUS } from '../../theme'

// 1·2·3등: 금 · 은 · 동 메달. 1등에는 왕관을 얹어요.
const MEDALS = {
  1: { name: '금메달', gradient: 'linear-gradient(145deg, #F8D57A, #E2B04A 55%, #B88626)', rim: '#B88626' },
  2: { name: '은메달', gradient: 'linear-gradient(145deg, #F1F2F5, #C3C7CF 55%, #8C919B)', rim: '#8C919B' },
  3: { name: '동메달', gradient: 'linear-gradient(145deg, #EDBB8B, #C98A52 55%, #9A5F2F)', rim: '#9A5F2F' },
}

const SIZES = {
  1: { width: 220, minHeight: 300, avatar: 104, name: '1.2rem', medal: 44 },
  2: { width: 176, minHeight: 250, avatar: 84, name: '1.02rem', medal: 38 },
  3: { width: 176, minHeight: 250, avatar: 84, name: '1.02rem', medal: 38 },
}

// 모바일에서는 1·2·3등 순서로 세로로 쌓고, 넓은 화면에서는 2·1·3 시상대 모양으로 놓아요.
const RANK_ORDER = { 1: { xs: 1, sm: 0 }, 2: { xs: 2, sm: 0 }, 3: { xs: 3, sm: 0 } }

const Crown = () => (
  <Box
    component="svg"
    aria-hidden="true"
    viewBox="0 0 64 40"
    sx={{ position: 'absolute', top: -26, left: '50%', width: 62, height: 38, ml: '-31px', pointerEvents: 'none' }}
  >
    <path d="M5 35 L10 10 L24 23 L32 4 L40 23 L54 10 L59 35 Z" fill="#E2B04A" stroke="#6B4423" strokeWidth="3" strokeLinejoin="round" />
    <rect x="5" y="31" width="54" height="6" rx="2" fill="#B88626" stroke="#6B4423" strokeWidth="3" />
    <circle cx="10" cy="9" r="3.2" fill="#C94F4F" stroke="#6B4423" strokeWidth="1.5" />
    <circle cx="32" cy="3.5" r="3.4" fill="#C94F4F" stroke="#6B4423" strokeWidth="1.5" />
    <circle cx="54" cy="9" r="3.2" fill="#C94F4F" stroke="#6B4423" strokeWidth="1.5" />
  </Box>
)

const PodiumCard = ({ item }) => {
  const medal = MEDALS[item.rank]
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
        mt: item.rank === 1 ? { xs: 3, sm: 0 } : 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        px: 2,
        pt: { xs: 3.5, sm: 4.5 },
        pb: 2.5,
        ...PARCHMENT_SX,
        // 위쪽을 아치 모양으로, 테두리는 메달 색
        borderRadius: { xs: RADIUS.lg, sm: '999px 999px 18px 18px' },
        borderColor: medal.rim,
        borderWidth: 3,
        ...(item.isMine && { boxShadow: `inset 0 0 0 3px rgba(255,248,225,0.7), 0 0 0 3px rgba(226,176,74,0.7)` }),
      }}
      aria-current={item.isMine ? 'true' : undefined}
    >
      {item.rank === 1 && <Crown />}
      <Box
        role="img"
        aria-label={`${item.rank}위 ${medal.name}`}
        sx={{
          width: size.medal,
          height: size.medal,
          borderRadius: RADIUS.round,
          background: medal.gradient,
          color: '#3E2713',
          border: '3px solid',
          borderColor: medal.rim,
          display: 'grid',
          placeItems: 'center',
          fontFamily: DISPLAY_FONT,
          fontWeight: 900,
          fontSize: item.rank === 1 ? '1.3rem' : '1.1rem',
          mb: 1.5,
          boxShadow: '0 2px 0 rgba(33,20,10,0.35)',
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
          bgcolor: item.avatarImage ? 'transparent' : 'rgba(255,255,255,0.6)',
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
      <Typography
        {...(item.to ? { component: Link, to: item.to } : {})}
        sx={{ fontFamily: DISPLAY_FONT, fontWeight: 900, fontSize: size.name, maxWidth: '100%', color: 'primary.main', textDecoration: 'none', ...(item.to && { '&:hover': { textDecoration: 'underline' } }) }}
        noWrap
      >
        {item.primaryText}
      </Typography>
      {item.levelBadge && (
        <Box
          sx={{
            mt: 0.5,
            px: 1,
            py: 0.2,
            borderRadius: RADIUS.pill,
            bgcolor: 'wood.main',
            color: 'gold.light',
            fontSize: '0.75rem',
            fontWeight: 800,
          }}
        >
          {item.levelBadge}
        </Box>
      )}
      {item.secondaryText && (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25, maxWidth: '100%' }} noWrap>
          {item.secondaryText}
        </Typography>
      )}
      <RankingValue kind={item.valueKind} value={item.valueText} size={item.rank === 1 ? 'lg' : 'md'} sx={{ mt: 'auto', pt: 1.5, color: 'text.primary' }} />
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
        gap: { xs: 2, sm: 2.5 },
        mt: 4,
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
