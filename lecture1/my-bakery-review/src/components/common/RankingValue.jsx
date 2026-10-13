import Box from '@mui/material/Box'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import StarRoundedIcon from '@mui/icons-material/StarRounded'

// 랭킹 점수 앞에 붙는 선 아이콘 (예전에는 ✍️ 📍 ❤️ 이모지를 썼어요)
const ICON_BY_KIND = {
  review: EditOutlinedIcon,
  visit: PlaceOutlinedIcon,
  heart: FavoriteBorderIcon,
  exp: StarRoundedIcon,
}

const LABEL_BY_KIND = { review: '리뷰', visit: '방문', heart: '좋아요', exp: 'EXP' }

const RankingValue = ({ kind, value, size = 'md', sx }) => {
  const Icon = ICON_BY_KIND[kind] ?? FavoriteBorderIcon
  const isLarge = size === 'lg'

  return (
    <Box
      aria-label={`${LABEL_BY_KIND[kind] ?? ''} ${value}`}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 800, ...sx }}
    >
      <Icon sx={{ fontSize: isLarge ? '1.2rem' : '1rem' }} />
      <Box component="span" sx={{ fontSize: isLarge ? '1.4rem' : '1rem' }}>
        {value}
      </Box>
    </Box>
  )
}

export default RankingValue
